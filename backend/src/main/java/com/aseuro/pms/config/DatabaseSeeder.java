package com.aseuro.pms.config;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository,
            PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (employeeRepository.count() > 0) {
            return; // Database already seeded
        }

        // 1. Create Users
        Employee hr = Employee.builder()
                .email("hr@aseuro.com")
                .password(passwordEncoder.encode("password"))
                .name("Bob HR")
                .department("Human Resources")
                .designation("HR Director")
                .joiningDate(LocalDate.of(2022, 1, 15))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_HR)
                .build();
        employeeRepository.save(hr);

        Employee manager = Employee.builder()
                .email("manager@aseuro.com")
                .password(passwordEncoder.encode("password"))
                .name("Alice Smith")
                .department("Engineering")
                .team("Core Platform")
                .designation("Engineering Manager")
                .joiningDate(LocalDate.of(2021, 6, 1))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_MANAGER)
                .build();
        employeeRepository.save(manager);

        Employee employee = Employee.builder()
                .email("employee@aseuro.com")
                .password(passwordEncoder.encode("password"))
                .name("John Doe")
                .department("Engineering")
                .team("Core Platform")
                .designation("Senior Software Engineer")
                .manager(manager)
                .joiningDate(LocalDate.of(2023, 3, 10))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_EMPLOYEE)
                .build();
        employeeRepository.save(employee);

        // 2. Seed active PMS Cycle (August 2026)
        PmsAssignment currentAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("August 2026")
                .status(PMSState.PMS_STARTED)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .submissionDeadline(LocalDate.of(2026, 9, 10))
                .build();
        pmsAssignmentRepository.save(currentAssignment);

        PmsKpi kpi1 = PmsKpi.builder()
                .assignment(currentAssignment)
                .kpiName("Code Quality")
                .description("Maintain code quality, test coverage, and reduce production defects.")
                .weightage(20.0)
                .build();
        PmsKpi kpi2 = PmsKpi.builder()
                .assignment(currentAssignment)
                .kpiName("Delivery & Speed")
                .description("Deliver sprint tasks within estimation timelines with minimal spillover.")
                .weightage(40.0)
                .build();
        PmsKpi kpi3 = PmsKpi.builder()
                .assignment(currentAssignment)
                .kpiName("Communication & Collaboration")
                .description("Collaborate effectively with cross-functional teams and maintain clear updates.")
                .weightage(20.0)
                .build();
        PmsKpi kpi4 = PmsKpi.builder()
                .assignment(currentAssignment)
                .kpiName("Innovation & Optimization")
                .description("Propose and implement performance optimizations or developer workflow tooling.")
                .weightage(20.0)
                .build();
        pmsKpiRepository.saveAll(List.of(kpi1, kpi2, kpi3, kpi4));

        // Create empty ratings template
        EmployeeKpiRating r1 = EmployeeKpiRating.builder().assignment(currentAssignment).kpi(kpi1).status("PENDING").build();
        EmployeeKpiRating r2 = EmployeeKpiRating.builder().assignment(currentAssignment).kpi(kpi2).status("PENDING").build();
        EmployeeKpiRating r3 = EmployeeKpiRating.builder().assignment(currentAssignment).kpi(kpi3).status("PENDING").build();
        EmployeeKpiRating r4 = EmployeeKpiRating.builder().assignment(currentAssignment).kpi(kpi4).status("PENDING").build();
        employeeKpiRatingRepository.saveAll(List.of(r1, r2, r3, r4));


        // 3. Seed Finalized History Records (July 2026)
        PmsAssignment julyAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("July 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 31))
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .overallScore(4.25)
                .performanceGrade("Excellent Performance")
                .build();
        pmsAssignmentRepository.save(julyAssignment);

        PmsKpi jkpi1 = PmsKpi.builder().assignment(julyAssignment).kpiName("Code Quality").description("Maintain code quality.").weightage(25.0).build();
        PmsKpi jkpi2 = PmsKpi.builder().assignment(julyAssignment).kpiName("Delivery & Speed").description("Sprint goals delivery.").weightage(50.0).build();
        PmsKpi jkpi3 = PmsKpi.builder().assignment(julyAssignment).kpiName("Teamwork").description("Effective team communication.").weightage(25.0).build();
        pmsKpiRepository.saveAll(List.of(jkpi1, jkpi2, jkpi3));

        EmployeeKpiRating jr1 = EmployeeKpiRating.builder()
                .assignment(julyAssignment).kpi(jkpi1).selfRating(4.0).managerRating(4.5).hrRating(4.5)
                .comments("Achieved 85% test coverage in core module").status("COMPLETED").build();
        EmployeeKpiRating jr2 = EmployeeKpiRating.builder()
                .assignment(julyAssignment).kpi(jkpi2).selfRating(4.0).managerRating(4.0).hrRating(4.0)
                .comments("Completed all core features in July release").status("COMPLETED").build();
        EmployeeKpiRating jr3 = EmployeeKpiRating.builder()
                .assignment(julyAssignment).kpi(jkpi3).selfRating(4.5).managerRating(4.5).hrRating(4.5)
                .comments("Conducted onboarding sessions for new hires").status("COMPLETED").build();
        employeeKpiRatingRepository.saveAll(List.of(jr1, jr2, jr3));

        EmployeeReview jReview = EmployeeReview.builder()
                .assignment(julyAssignment)
                .reviewer(manager)
                .comments("John performed exceptionally well this month. His contribution to the testing suite was major.")
                .reviewDate(LocalDate.of(2026, 7, 27))
                .build();
        employeeReviewRepository.save(jReview);

        FinalPmsResult jResult = FinalPmsResult.builder()
                .assignment(julyAssignment)
                .finalScore(4.25)
                .grade("Excellent Performance")
                .finalizedBy(hr)
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .build();
        finalPmsResultRepository.save(jResult);

        PmsHistory julyHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("July 2026")
                .finalScore(4.25)
                .grade("Excellent Performance")
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .assignmentId(julyAssignment.getId())
                .build();
        pmsHistoryRepository.save(julyHistory);

        // 4. Seed history (June 2026)
        PmsAssignment juneAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("June 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .finalizedDate(LocalDate.of(2026, 6, 28))
                .overallScore(3.90)
                .performanceGrade("Good Performance")
                .build();
        pmsAssignmentRepository.save(juneAssignment);

        PmsHistory juneHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("June 2026")
                .finalScore(3.90)
                .grade("Good Performance")
                .finalizedDate(LocalDate.of(2026, 6, 28))
                .assignmentId(juneAssignment.getId())
                .build();
        pmsHistoryRepository.save(juneHistory);

        // 5. Seed history (May 2026)
        PmsAssignment mayAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("May 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 5, 1))
                .endDate(LocalDate.of(2026, 5, 31))
                .finalizedDate(LocalDate.of(2026, 5, 28))
                .overallScore(4.10)
                .performanceGrade("Excellent Performance")
                .build();
        pmsAssignmentRepository.save(mayAssignment);

        PmsHistory mayHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("May 2026")
                .finalScore(4.10)
                .grade("Excellent Performance")
                .finalizedDate(LocalDate.of(2026, 5, 28))
                .assignmentId(mayAssignment.getId())
                .build();
        pmsHistoryRepository.save(mayHistory);
    }
}
