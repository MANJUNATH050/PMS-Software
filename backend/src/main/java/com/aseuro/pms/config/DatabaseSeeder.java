package com.aseuro.pms.config;

<<<<<<< HEAD
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.boot.CommandLineRunner;
=======
import com.aseuro.pms.entity.Department;
import com.aseuro.pms.entity.Designation;
import com.aseuro.pms.entity.Employee;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.entity.User;
import com.aseuro.pms.entity.UserRole;
import com.aseuro.pms.repository.DepartmentRepository;
import com.aseuro.pms.repository.DesignationRepository;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
<<<<<<< HEAD
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
=======
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Checking and seeding initial PMS database records...");

        // 1. Seed Departments
        seedDepartments();

        // 2. Seed Designations
        seedDesignations();

        // 3. Seed Primary HR User (aishwarya.logaraj@aseuro.in)
        seedHrUser();

        // 4. Seed Initial Manager & Employee for testing login
        seedInitialManagerAndEmployee();

        log.info("Database seeding completed successfully.");
    }

    private void seedDepartments() {
        List<String> defaultDepts = List.of(
                "Engineering",
                "Human Resources",
                "Sales & Marketing",
                "Product & Design",
                "Finance & Operations"
        );
        for (String name : defaultDepts) {
            if (departmentRepository.findByNameIgnoreCase(name).isEmpty()) {
                Department dept = new Department(name, name + " Department");
                departmentRepository.save(dept);
                log.info("Seeded department: {}", name);
            }
        }
    }

    private void seedDesignations() {
        List<String> defaultDesignations = List.of(
                "Engineering Manager",
                "Senior Software Engineer",
                "Software Engineer",
                "Associate Software Engineer",
                "HR Lead",
                "HR Executive",
                "Product Manager",
                "UI/UX Designer",
                "QA Engineer"
        );
        for (String name : defaultDesignations) {
            if (designationRepository.findByNameIgnoreCase(name).isEmpty()) {
                Designation designation = new Designation(name, name + " Role");
                designationRepository.save(designation);
                log.info("Seeded designation: {}", name);
            }
        }
    }

    private void seedHrUser() {
        String hrEmail = "aishwarya.logaraj@aseuro.in";
        if (userRepository.findByEmailIgnoreCase(hrEmail).isEmpty()) {
            User hrUser = new User();
            hrUser.setUsername("aishwarya.logaraj");
            hrUser.setEmail(hrEmail);
            hrUser.setPasswordHash(passwordEncoder.encode("Aseuro@123"));
            hrUser.setRole(UserRole.HR);
            hrUser.setStatus(RecordStatus.ACTIVE);
            User savedUser = userRepository.save(hrUser);

            // Also create employee profile for HR
            Department hrDept = departmentRepository.findByNameIgnoreCase("Human Resources").orElse(null);
            Designation hrRole = designationRepository.findByNameIgnoreCase("HR Lead").orElse(null);

            Employee hrEmp = new Employee();
            hrEmp.setUser(savedUser);
            hrEmp.setEmployeeCode("HR-001");
            hrEmp.setFullName("Aishwarya Logaraj");
            hrEmp.setEmail(hrEmail);
            if (hrDept != null) hrEmp.setDepartmentId(hrDept.getId());
            if (hrRole != null) hrEmp.setDesignationId(hrRole.getId());
            hrEmp.setJoiningDate(LocalDate.of(2023, 1, 15));
            hrEmp.setStatus(RecordStatus.ACTIVE);
            employeeRepository.save(hrEmp);

            log.info("Provisioned HR Administrator account: {}", hrEmail);
        }
    }

    private void seedInitialManagerAndEmployee() {
        Department engDept = departmentRepository.findByNameIgnoreCase("Engineering").orElse(null);
        Designation mgrDesig = designationRepository.findByNameIgnoreCase("Engineering Manager").orElse(null);
        Designation sdeDesig = designationRepository.findByNameIgnoreCase("Software Engineer").orElse(null);

        // 1. Seed Manager
        String mgrEmail = "manager@aseuro.in";
        Employee savedMgr = null;
        if (userRepository.findByEmailIgnoreCase(mgrEmail).isEmpty()) {
            User mgrUser = new User();
            mgrUser.setUsername("rajesh.manager");
            mgrUser.setEmail(mgrEmail);
            mgrUser.setPasswordHash(passwordEncoder.encode("Manager@123"));
            mgrUser.setRole(UserRole.MANAGER);
            mgrUser.setStatus(RecordStatus.ACTIVE);
            User saved = userRepository.save(mgrUser);

            Employee mgrEmp = new Employee();
            mgrEmp.setUser(saved);
            mgrEmp.setEmployeeCode("MGR-101");
            mgrEmp.setFullName("Rajesh Sharma");
            mgrEmp.setEmail(mgrEmail);
            if (engDept != null) mgrEmp.setDepartmentId(engDept.getId());
            if (mgrDesig != null) mgrEmp.setDesignationId(mgrDesig.getId());
            mgrEmp.setJoiningDate(LocalDate.of(2022, 6, 1));
            mgrEmp.setStatus(RecordStatus.ACTIVE);
            savedMgr = employeeRepository.save(mgrEmp);
            log.info("Provisioned Manager account: {}", mgrEmail);
        } else {
            savedMgr = employeeRepository.findByEmailIgnoreCase(mgrEmail).orElse(null);
        }

        // 2. Seed Employee
        String empEmail = "employee@aseuro.in";
        if (userRepository.findByEmailIgnoreCase(empEmail).isEmpty()) {
            User empUser = new User();
            empUser.setUsername("kiran.employee");
            empUser.setEmail(empEmail);
            empUser.setPasswordHash(passwordEncoder.encode("Employee@123"));
            empUser.setRole(UserRole.EMPLOYEE);
            empUser.setStatus(RecordStatus.ACTIVE);
            User saved = userRepository.save(empUser);

            Employee emp = new Employee();
            emp.setUser(saved);
            emp.setEmployeeCode("EMP-201");
            emp.setFullName("Kiran Kumar");
            emp.setEmail(empEmail);
            if (engDept != null) emp.setDepartmentId(engDept.getId());
            if (sdeDesig != null) emp.setDesignationId(sdeDesig.getId());
            if (savedMgr != null) emp.setManagerId(savedMgr.getId());
            emp.setJoiningDate(LocalDate.of(2024, 2, 10));
            emp.setStatus(RecordStatus.ACTIVE);
            employeeRepository.save(emp);
            log.info("Provisioned Employee account: {}", empEmail);
        }
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
    }
}
