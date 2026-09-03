package com.aseuro.pms.config;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

        private final EmployeeRepository employeeRepository;
        private final PmsAssignmentRepository pmsAssignmentRepository;
        private final PmsKpiRepository pmsKpiRepository;
        private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
        private final EmployeeReviewRepository employeeReviewRepository;
        private final FinalPmsResultRepository finalPmsResultRepository;
        private final PmsHistoryRepository pmsHistoryRepository;
        private final KpiMasterRepository kpiMasterRepository;
        private final PasswordEncoder passwordEncoder;

        public DatabaseSeeder(
                        EmployeeRepository employeeRepository,
                        PmsAssignmentRepository pmsAssignmentRepository,
                        PmsKpiRepository pmsKpiRepository,
                        EmployeeKpiRatingRepository employeeKpiRatingRepository,
                        EmployeeReviewRepository employeeReviewRepository,
                        FinalPmsResultRepository finalPmsResultRepository,
                        PmsHistoryRepository pmsHistoryRepository,
                        KpiMasterRepository kpiMasterRepository,
                        PasswordEncoder passwordEncoder) {
                this.employeeRepository = employeeRepository;
                this.pmsAssignmentRepository = pmsAssignmentRepository;
                this.pmsKpiRepository = pmsKpiRepository;
                this.employeeKpiRatingRepository = employeeKpiRatingRepository;
                this.employeeReviewRepository = employeeReviewRepository;
                this.finalPmsResultRepository = finalPmsResultRepository;
                this.pmsHistoryRepository = pmsHistoryRepository;
                this.kpiMasterRepository = kpiMasterRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                seedKpiMasterData();
                ensureHrAccount();

                if (employeeRepository.count() > 0) {
                        // Ensure Manager user has active August 2026 assignment & known password Manager@12345

                        // Ensure Manager user has active August 2026 assignment & known password Manager@12345
                        employeeRepository.findByEmail("manager@aseuro.com").ifPresent(mgr -> {
                                mgr.setPassword(passwordEncoder.encode("Manager@12345"));
                                employeeRepository.save(mgr);

                                List<PmsAssignment> mgrAssignments = pmsAssignmentRepository.findByEmployee(mgr);
                                boolean hasAug2026 = mgrAssignments.stream()
                                                .anyMatch(a -> "August 2026".equals(a.getCycleMonth()));
                                if (!hasAug2026) {
                                        seedManagerAugustAssignment(mgr);
                                }
                        });

                        // Ensure August 2026 assignment is in fresh draft state for self-assessment testing & password Emp@12345
                        employeeRepository.findByEmail("employee@aseuro.com").ifPresent(emp -> {
                                emp.setPassword(passwordEncoder.encode("Emp@12345"));
                                employeeRepository.save(emp);
                                Employee mgr = employeeRepository.findByEmail("manager@aseuro.com").orElse(null);
                                Employee hrUser = employeeRepository.findByEmail("hr@aseuro.com").orElse(null);
                                syncEmployeeHistoricalAssignments(emp, mgr, hrUser);

                                List<PmsAssignment> assignments = pmsAssignmentRepository.findByEmployee(emp);
                                for (PmsAssignment a : assignments) {
                                        if ("August 2026".equals(a.getCycleMonth())) {
                                                a.setStatus(PMSState.SELF_ASSESSMENT_DRAFT);
                                                a.setOverallScore(null);
                                                a.setPerformanceGrade(null);
                                                a.setFinalizedDate(null);
                                                pmsAssignmentRepository.save(a);

                                                List<EmployeeKpiRating> ratings = employeeKpiRatingRepository
                                                                .findByAssignment(a);
                                                if (!ratings.isEmpty()) {
                                                        employeeKpiRatingRepository.deleteAll(ratings);
                                                }
                                        }
                                }
                        });
                        return;
                }

                // 1. Create Users
                Employee manager = Employee.builder()
                                .email("manager@aseuro.com")
                                .password(passwordEncoder.encode("Manager@12345"))
                                .name("Alice Smith")
                                .employeeCode("MGR-1001")
                                .department("Engineering")
                                .team("Core Platform")
                                .designation("Engineering Manager")
                                .joiningDate(LocalDate.of(2021, 6, 1))
                                .accountStatus("ACTIVE")
                                .role(Role.ROLE_MANAGER)
                                .build();
                employeeRepository.save(manager);

                Employee hr = Employee.builder()
                                .email("hr@aseuro.com")
                                .password(passwordEncoder.encode("Hr@12345"))
                                .name("HR")
                                .employeeCode("HR-1001")
                                .department("Human Resources")
                                .designation("HR Director")
                                .manager(manager)
                                .joiningDate(LocalDate.of(2022, 1, 15))
                                .accountStatus("ACTIVE")
                                .role(Role.ROLE_HR)
                                .build();
                employeeRepository.save(hr);

                Employee employee = Employee.builder()
                                .email("employee@aseuro.com")
                                .password(passwordEncoder.encode("Emp@12345"))
                                .name("John Doe")
                                .employeeCode("EMP-1001")
                                .department("Engineering")
                                .team("Core Platform")
                                .designation("Software Engineer")
                                .manager(manager)
                                .joiningDate(LocalDate.of(2023, 3, 10))
                                .accountStatus("ACTIVE")
                                .role(Role.ROLE_EMPLOYEE)
                                .build();
                employeeRepository.save(employee);

                // 2. Create Active PMS Assignment for August 2026 (Fresh Self-Assessment Draft)
                PmsAssignment currentAssignment = PmsAssignment.builder()
                                .employee(employee)
                                .cycleMonth("August 2026")
                                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                                .startDate(LocalDate.of(2026, 8, 1))
                                .endDate(LocalDate.of(2026, 8, 31))
                                .submissionDeadline(LocalDate.of(2026, 8, 25))
                                .build();
                pmsAssignmentRepository.save(currentAssignment);

                PmsKpi kpi1 = PmsKpi.builder()
                                .assignment(currentAssignment)
                                .kpiName("Code Quality")
                                .description("Maintain code quality, test coverage >= 85%, and reduce production defect escapes.")
                                .weightage(20.0)
                                .build();

                PmsKpi kpi2 = PmsKpi.builder()
                                .assignment(currentAssignment)
                                .kpiName("Delivery & Speed")
                                .description("Deliver sprint backlog tasks within estimation timelines with minimal spillover.")
                                .weightage(40.0)
                                .build();

                PmsKpi kpi3 = PmsKpi.builder()
                                .assignment(currentAssignment)
                                .kpiName("Communication & Collaboration")
                                .description("Collaborate effectively with cross-functional teams, participate in reviews and standups.")
                                .weightage(20.0)
                                .build();

                PmsKpi kpi4 = PmsKpi.builder()
                                .assignment(currentAssignment)
                                .kpiName("Innovation & Optimization")
                                .description("Propose and implement developer workflow tooling, CI/CD optimizations, and clean architecture.")
                                .weightage(20.0)
                                .build();

                pmsKpiRepository.saveAll(List.of(kpi1, kpi2, kpi3, kpi4));

                // Create Active PMS Assignment for HR and Manager users for August 2026
                seedHrAugustAssignment(hr);
                seedManagerAugustAssignment(manager);

                // 3. Seed history (July 2026)
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

                PmsKpi julyKpi1 = PmsKpi.builder()
                                .assignment(julyAssignment)
                                .kpiName("Sprint Goal Achievement")
                                .description("Successfully completed all assigned sprint goals.")
                                .weightage(40.0)
                                .build();
                pmsKpiRepository.save(julyKpi1);

                EmployeeKpiRating julyRating1 = EmployeeKpiRating.builder()
                                .assignment(julyAssignment)
                                .kpi(julyKpi1)
                                .selfRating(4.5)
                                .comments("Delivered high performance features ahead of deadlines.")
                                .build();
                employeeKpiRatingRepository.save(julyRating1);

                EmployeeReview julyReview = EmployeeReview.builder()
                                .assignment(julyAssignment)
                                .reviewer(manager)
                                .comments("Exceptional velocity and dependable work throughout July.")
                                .reviewDate(LocalDate.of(2026, 7, 26))
                                .build();
                employeeReviewRepository.save(julyReview);

                FinalPmsResult julyResult = FinalPmsResult.builder()
                                .assignment(julyAssignment)
                                .finalScore(4.25)
                                .grade("Excellent Performance")
                                .finalizedBy(hr)
                                .finalizedDate(LocalDate.of(2026, 7, 28))
                                .build();
                finalPmsResultRepository.save(julyResult);

                PmsHistory julyHistory = PmsHistory.builder()
                                .employee(employee)
                                .cycleMonth("July 2026")
                                .finalScore(4.25)
                                .grade("Excellent Performance")
                                .finalizedDate(LocalDate.of(2026, 7, 28))
                                .assignmentId(julyAssignment.getId())
                                .build();
                pmsHistoryRepository.save(julyHistory);

                seedHrReviewKpisForAssignment(julyAssignment, 5.0, "FINALIZED");

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

        private void seedKpiMasterData() {
                if (kpiMasterRepository.count() > 0) {
                        // Ensure all existing null categories are set to ROLE_KPI
                        List<KpiMaster> all = kpiMasterRepository.findAll();
                        for (KpiMaster km : all) {
                                if (km.getKpiCategory() == null) {
                                        km.setKpiCategory("ROLE_KPI");
                                        kpiMasterRepository.save(km);
                                }
                        }
                        if (kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE").isEmpty()) {
                                seedHrReviewKpis();
                        }
                        return;
                }

                // Software Engineer KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Software Engineer")
                                .kpiName("Code Quality")
                                .description("Maintain high code quality, test coverage > 80%, and adhere to best practices.")
                                .weightage(20.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Software Engineer")
                                .kpiName("Delivery & Speed")
                                .description("Deliver sprint tasks within estimation timelines with minimal spillover.")
                                .weightage(40.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Software Engineer")
                                .kpiName("Communication & Collaboration")
                                .description("Collaborate effectively with cross-functional teams and maintain clear updates.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Software Engineer")
                                .kpiName("Innovation & Optimization")
                                .description("Propose and implement performance optimizations or developer workflow tooling.")
                                .weightage(20.0)
                                .applicableFor("Employee")
                                .build());

                // Senior Software Engineer KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Senior Software Engineer")
                                .kpiName("Architecture & Design")
                                .description("Design robust, scalable system architecture and conduct high-standard code reviews.")
                                .weightage(25.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Senior Software Engineer")
                                .kpiName("Feature Delivery & Velocity")
                                .description("Lead delivery of complex epic features and unblock teammates during sprints.")
                                .weightage(35.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Senior Software Engineer")
                                .kpiName("Team Mentorship")
                                .description("Mentor junior and mid-level engineers and conduct brown bag technical sessions.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Senior Software Engineer")
                                .kpiName("CI/CD & DevOps Excellence")
                                .description("Improve build pipelines, decrease deployment friction, and ensure system uptime >= 99.9%.")
                                .weightage(20.0)
                                .applicableFor("Employee")
                                .build());

                // Tech Lead KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Tech Lead")
                                .kpiName("Technical Strategy & Architecture")
                                .description("Define roadmap technical milestones, service boundaries, and cross-cutting frameworks.")
                                .weightage(30.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Tech Lead")
                                .kpiName("Sprint Execution & Delivery")
                                .description("Manage technical commitments, break down epics, and drive sprint velocity.")
                                .weightage(30.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Tech Lead")
                                .kpiName("Engineering Leadership & Standards")
                                .description("Establish engineering excellence, quality standards, and mentor team members.")
                                .weightage(25.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Tech Lead")
                                .kpiName("Stakeholder Alignment")
                                .description("Partner with product managers, QA, and HR to align delivery expectations.")
                                .weightage(15.0)
                                .applicableFor("Both Employee & Manager")
                                .build());

                // Engineering Manager KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Engineering Manager")
                                .kpiName("Team Delivery & Milestones")
                                .description("Ensure on-time delivery of quarterly organizational commitments and sprint objectives.")
                                .weightage(35.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Engineering Manager")
                                .kpiName("People Management & Growth")
                                .description("Drive 1-on-1s, career growth, performance appraisals, and retain engineering talent.")
                                .weightage(25.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Engineering Manager")
                                .kpiName("Strategic Planning & Budgeting")
                                .description("Plan resource allocation, hiring, and technology investments.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("Engineering Manager")
                                .kpiName("Operational Excellence")
                                .description("Foster agile best practices, incident retrospectives, and cross-team alignment.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());

                // QA Engineer KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("QA Engineer")
                                .kpiName("Test Automation & Coverage")
                                .description("Develop automated end-to-end regression test suites and maintain > 90% automation coverage.")
                                .weightage(35.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("QA Engineer")
                                .kpiName("Defect Prevention & Quality")
                                .description("Identify critical bugs early in sprint cycle and ensure zero production P0 escapes.")
                                .weightage(30.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("QA Engineer")
                                .kpiName("Release Verification")
                                .description("Perform staging sign-offs, smoke testing, and continuous deployment validation.")
                                .weightage(20.0)
                                .applicableFor("Employee")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("QA Engineer")
                                .kpiName("Documentation & Standards")
                                .description("Maintain detailed test plans, bug reproduction steps, and testing documentation.")
                                .weightage(15.0)
                                .applicableFor("Employee")
                                .build());

                // HR Director KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Recruitment & Talent Acquisition")
                                .description("Source top talent, reduce time-to-hire, and meet organizational staffing roadmaps.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Employee Engagement & Retention")
                                .description("Conduct quarterly engagement initiatives, pulse surveys, and improve employee retention rate >= 92%.")
                                .weightage(15.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Performance Management & Appraisals")
                                .description("Oversee timely execution of monthly and quarterly PMS cycles, manager reviews, and calibration.")
                                .weightage(15.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("HR Policy Compliance & Audits")
                                .description("Enforce 100% statutory labor compliance, workplace safety regulations, and internal audits.")
                                .weightage(15.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Training & Leadership Development")
                                .description("Plan and deliver upskilling programs, leadership brown bags, and technical certifications.")
                                .weightage(15.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Payroll & Benefits Administration")
                                .description("Coordinate accurate monthly payroll processing, tax compliance, and benefit disbursements.")
                                .weightage(10.0)
                                .applicableFor("Both Employee & Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Director")
                                .kpiName("Workplace Culture & Employee Welfare")
                                .description("Promote positive team collaboration, new initiatives, rewards, and recognition programs.")
                                .weightage(10.0)
                                .applicableFor("Both Employee & Manager")
                                .build());

                // HR Manager KPIs (Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Manager")
                                .kpiName("Recruitment & Talent Sourcing")
                                .description("Execute candidate screening, technical interviews, and on-time candidate onboarding.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Manager")
                                .kpiName("Performance Review Operations")
                                .description("Coordinate PMS submissions, manager reviews, and resolve workflow bottlenecks.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Manager")
                                .kpiName("HR Policy Implementation")
                                .description("Roll out organizational policies, leave systems, and employee welfare programs.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Manager")
                                .kpiName("Employee Relations & Grievances")
                                .description("Facilitate timely resolution of employee grievances and mediate manager discussions.")
                                .weightage(20.0)
                                .applicableFor("Manager")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("HR Manager")
                                .kpiName("HR Operations & Documentation")
                                .description("Maintain employee service records, offer letters, and policy handbooks with 100% accuracy.")
                                .weightage(10.0)
                                .applicableFor("Manager")
                                .build());

                seedHrReviewKpis();
        }

        private void seedHrReviewKpis() {
                if (!kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE").isEmpty()) {
                        return;
                }

                // HR Review KPIs (Global for All Employees, Total = 100%)
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("ALL")
                                .kpiName("Leave Pattern")
                                .description("Planned leaves should be 95% of total leaves; unplanned leaves should not exceed 5% in a year, including sick leave; sick leave every month for more than two days requires a medical certificate.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .kpiCategory("HR_REVIEW_KPI")
                                .status("ACTIVE")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("ALL")
                                .kpiName("Team Collaboration and Engagement")
                                .description("Active cross-functional collaboration, participation in team activities, and fostering positive team dynamics.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .kpiCategory("HR_REVIEW_KPI")
                                .status("ACTIVE")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("ALL")
                                .kpiName("Punctuality")
                                .description("Adherence to work hours, prompt attendance in scrum meetings, sprint ceremonies, and timely deliverables.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .kpiCategory("HR_REVIEW_KPI")
                                .status("ACTIVE")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("ALL")
                                .kpiName("New Initiatives and Participation")
                                .description("Contribution to process improvements, knowledge sharing sessions, brown bags, and company-wide initiatives.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .kpiCategory("HR_REVIEW_KPI")
                                .status("ACTIVE")
                                .build());
                kpiMasterRepository.save(KpiMaster.builder()
                                .designation("ALL")
                                .kpiName("Rewards")
                                .description("Recognition through spot awards, peer commendations, customer appreciation, and exceptional contributions.")
                                .weightage(20.0)
                                .applicableFor("Both Employee & Manager")
                                .kpiCategory("HR_REVIEW_KPI")
                                .status("ACTIVE")
                                .build());
        }

        private void syncEmployeeHistoricalAssignments(Employee emp, Employee manager, Employee hr) {
                // July 2026
                PmsAssignment julyAssignment = pmsAssignmentRepository.findByEmployeeAndCycleMonth(emp, "July 2026")
                                .orElseGet(() -> {
                                        PmsAssignment ja = PmsAssignment.builder()
                                                        .employee(emp)
                                                        .cycleMonth("July 2026")
                                                        .status(PMSState.COMPLETED)
                                                        .startDate(LocalDate.of(2026, 7, 1))
                                                        .endDate(LocalDate.of(2026, 7, 31))
                                                        .finalizedDate(LocalDate.of(2026, 7, 28))
                                                        .overallScore(4.25)
                                                        .performanceGrade("Excellent Performance")
                                                        .build();
                                        pmsAssignmentRepository.save(ja);

                                        PmsKpi julyKpi1 = PmsKpi.builder()
                                                        .assignment(ja)
                                                        .kpiName("Sprint Goal Achievement")
                                                        .description("Successfully completed all assigned sprint goals.")
                                                        .weightage(40.0)
                                                        .build();
                                        pmsKpiRepository.save(julyKpi1);

                                        EmployeeKpiRating julyRating1 = EmployeeKpiRating.builder()
                                                        .assignment(ja)
                                                        .kpi(julyKpi1)
                                                        .selfRating(4.5)
                                                        .comments("Delivered high performance features ahead of deadlines.")
                                                        .build();
                                        employeeKpiRatingRepository.save(julyRating1);

                                        if (manager != null) {
                                                EmployeeReview julyReview = EmployeeReview.builder()
                                                                .assignment(ja)
                                                                .reviewer(manager)
                                                                .comments("Exceptional velocity and dependable work throughout July.")
                                                                .reviewDate(LocalDate.of(2026, 7, 26))
                                                                .build();
                                                employeeReviewRepository.save(julyReview);
                                        }

                                        if (hr != null) {
                                                FinalPmsResult julyResult = FinalPmsResult.builder()
                                                                .assignment(ja)
                                                                .finalScore(4.25)
                                                                .grade("Excellent Performance")
                                                                .finalizedBy(hr)
                                                                .finalizedDate(LocalDate.of(2026, 7, 28))
                                                                .build();
                                                finalPmsResultRepository.save(julyResult);
                                        }

                                        return ja;
                                });

                // Update PmsHistory for July
                List<PmsHistory> histList = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(emp);
                Optional<PmsHistory> julyHistOpt = histList.stream().filter(h -> "July 2026".equals(h.getCycleMonth())).findFirst();
                if (julyHistOpt.isPresent()) {
                        PmsHistory jh = julyHistOpt.get();
                        jh.setAssignmentId(julyAssignment.getId());
                        pmsHistoryRepository.save(jh);
                } else {
                        pmsHistoryRepository.save(PmsHistory.builder()
                                        .employee(emp)
                                        .cycleMonth("July 2026")
                                        .finalScore(4.25)
                                        .grade("Excellent Performance")
                                        .finalizedDate(LocalDate.of(2026, 7, 28))
                                        .assignmentId(julyAssignment.getId())
                                        .build());
                }

                // Ensure HR review KPIs exist for July
                List<PmsKpi> existingHrKpis = pmsKpiRepository.findByAssignment(julyAssignment).stream()
                                .filter(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()))
                                .toList();
                if (existingHrKpis.isEmpty()) {
                        seedHrReviewKpisForAssignment(julyAssignment, 5.0, "FINALIZED");
                }

                // June 2026
                PmsAssignment juneAssignment = pmsAssignmentRepository.findByEmployeeAndCycleMonth(emp, "June 2026")
                                .orElseGet(() -> {
                                        PmsAssignment ja = PmsAssignment.builder()
                                                        .employee(emp)
                                                        .cycleMonth("June 2026")
                                                        .status(PMSState.COMPLETED)
                                                        .startDate(LocalDate.of(2026, 6, 1))
                                                        .endDate(LocalDate.of(2026, 6, 30))
                                                        .finalizedDate(LocalDate.of(2026, 6, 28))
                                                        .overallScore(3.90)
                                                        .performanceGrade("Good Performance")
                                                        .build();
                                        pmsAssignmentRepository.save(ja);

                                        PmsKpi juneKpi1 = PmsKpi.builder()
                                                        .assignment(ja)
                                                        .kpiName("Delivery & Execution")
                                                        .description("Executed all tasks on schedule.")
                                                        .weightage(40.0)
                                                        .build();
                                        pmsKpiRepository.save(juneKpi1);

                                        return ja;
                                });

                Optional<PmsHistory> juneHistOpt = histList.stream().filter(h -> "June 2026".equals(h.getCycleMonth())).findFirst();
                if (juneHistOpt.isPresent()) {
                        PmsHistory jh = juneHistOpt.get();
                        jh.setAssignmentId(juneAssignment.getId());
                        pmsHistoryRepository.save(jh);
                } else {
                        pmsHistoryRepository.save(PmsHistory.builder()
                                        .employee(emp)
                                        .cycleMonth("June 2026")
                                        .finalScore(3.90)
                                        .grade("Good Performance")
                                        .finalizedDate(LocalDate.of(2026, 6, 28))
                                        .assignmentId(juneAssignment.getId())
                                        .build());
                }

                // May 2026
                PmsAssignment mayAssignment = pmsAssignmentRepository.findByEmployeeAndCycleMonth(emp, "May 2026")
                                .orElseGet(() -> {
                                        PmsAssignment ma = PmsAssignment.builder()
                                                        .employee(emp)
                                                        .cycleMonth("May 2026")
                                                        .status(PMSState.COMPLETED)
                                                        .startDate(LocalDate.of(2026, 5, 1))
                                                        .endDate(LocalDate.of(2026, 5, 31))
                                                        .finalizedDate(LocalDate.of(2026, 5, 28))
                                                        .overallScore(4.10)
                                                        .performanceGrade("Excellent Performance")
                                                        .build();
                                        pmsAssignmentRepository.save(ma);

                                        PmsKpi mayKpi1 = PmsKpi.builder()
                                                        .assignment(ma)
                                                        .kpiName("Core Platform Modernization")
                                                        .description("Led key platform improvements.")
                                                        .weightage(40.0)
                                                        .build();
                                        pmsKpiRepository.save(mayKpi1);

                                        return ma;
                                });

                Optional<PmsHistory> mayHistOpt = histList.stream().filter(h -> "May 2026".equals(h.getCycleMonth())).findFirst();
                if (mayHistOpt.isPresent()) {
                        PmsHistory mh = mayHistOpt.get();
                        mh.setAssignmentId(mayAssignment.getId());
                        pmsHistoryRepository.save(mh);
                } else {
                        pmsHistoryRepository.save(PmsHistory.builder()
                                        .employee(emp)
                                        .cycleMonth("May 2026")
                                        .finalScore(4.10)
                                        .grade("Excellent Performance")
                                        .finalizedDate(LocalDate.of(2026, 5, 28))
                                        .assignmentId(mayAssignment.getId())
                                        .build());
                }
        }

        private void seedHrReviewKpisForAssignment(PmsAssignment assignment, Double hrRating, String status) {
                List<KpiMaster> hrMasters = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
                for (KpiMaster m : hrMasters) {
                        PmsKpi pk = PmsKpi.builder()
                                        .assignment(assignment)
                                        .kpiName(m.getKpiName())
                                        .description(m.getDescription())
                                        .weightage(m.getWeightage())
                                        .applicableFor(m.getApplicableFor())
                                        .kpiCategory("HR_REVIEW_KPI")
                                        .build();
                        pmsKpiRepository.save(pk);

                        EmployeeKpiRating r = EmployeeKpiRating.builder()
                                        .assignment(assignment)
                                        .kpi(pk)
                                        .hrRating(hrRating)
                                        .status(status)
                                        .build();
                        employeeKpiRatingRepository.save(r);
                }
        }

        private void seedHrAugustAssignment(Employee hr) {
                PmsAssignment hrAssignment = PmsAssignment.builder()
                                .employee(hr)
                                .cycleMonth("August 2026")
                                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                                .startDate(LocalDate.of(2026, 8, 1))
                                .endDate(LocalDate.of(2026, 8, 31))
                                .submissionDeadline(LocalDate.of(2026, 8, 25))
                                .build();
                pmsAssignmentRepository.save(hrAssignment);

                List<PmsKpi> hrKpis = List.of(
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Recruitment & Talent Acquisition")
                                                .description("Source top talent, reduce time-to-hire, and meet organizational staffing roadmaps.")
                                                .weightage(20.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Employee Engagement & Retention")
                                                .description("Conduct quarterly engagement initiatives, pulse surveys, and improve employee retention rate >= 92%.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Performance Management & Appraisals")
                                                .description("Oversee timely execution of monthly and quarterly PMS cycles, manager reviews, and calibration.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("HR Policy Compliance & Audits")
                                                .description("Enforce 100% statutory labor compliance, workplace safety regulations, and internal audits.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Training & Leadership Development")
                                                .description("Plan and deliver upskilling programs, leadership brown bags, and technical certifications.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Payroll & Benefits Administration")
                                                .description("Coordinate accurate monthly payroll processing, tax compliance, and benefit disbursements.")
                                                .weightage(10.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Workplace Culture & Employee Welfare")
                                                .description("Promote positive team collaboration, new initiatives, rewards, and recognition programs.")
                                                .weightage(10.0)
                                                .build());
                pmsKpiRepository.saveAll(hrKpis);
        }

        private void seedHrAugustKpisOnly(PmsAssignment hrAssignment) {
                List<PmsKpi> hrKpis = List.of(
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Recruitment & Talent Acquisition")
                                                .description("Source top talent, reduce time-to-hire, and meet organizational staffing roadmaps.")
                                                .weightage(20.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Employee Engagement & Retention")
                                                .description("Conduct quarterly engagement initiatives, pulse surveys, and improve employee retention rate >= 92%.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Performance Management & Appraisals")
                                                .description("Oversee timely execution of monthly and quarterly PMS cycles, manager reviews, and calibration.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("HR Policy Compliance & Audits")
                                                .description("Enforce 100% statutory labor compliance, workplace safety regulations, and internal audits.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Training & Leadership Development")
                                                .description("Plan and deliver upskilling programs, leadership brown bags, and technical certifications.")
                                                .weightage(15.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Payroll & Benefits Administration")
                                                .description("Coordinate accurate monthly payroll processing, tax compliance, and benefit disbursements.")
                                                .weightage(10.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(hrAssignment)
                                                .kpiName("Workplace Culture & Employee Welfare")
                                                .description("Promote positive team collaboration, new initiatives, rewards, and recognition programs.")
                                                .weightage(10.0)
                                                .build());
                pmsKpiRepository.saveAll(hrKpis);
        }

        private void seedManagerAugustAssignment(Employee manager) {
                PmsAssignment mgrAssignment = PmsAssignment.builder()
                                .employee(manager)
                                .cycleMonth("August 2026")
                                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                                .startDate(LocalDate.of(2026, 8, 1))
                                .endDate(LocalDate.of(2026, 8, 31))
                                .submissionDeadline(LocalDate.of(2026, 8, 25))
                                .build();
                pmsAssignmentRepository.save(mgrAssignment);

                List<PmsKpi> mgrKpis = List.of(
                                PmsKpi.builder()
                                                .assignment(mgrAssignment)
                                                .kpiName("Team Delivery & Milestones")
                                                .description("Ensure on-time delivery of quarterly organizational commitments and sprint objectives.")
                                                .weightage(35.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(mgrAssignment)
                                                .kpiName("People Management & Growth")
                                                .description("Drive 1-on-1s, career growth, performance appraisals, and retain engineering talent.")
                                                .weightage(25.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(mgrAssignment)
                                                .kpiName("Strategic Planning & Budgeting")
                                                .description("Plan resource allocation, hiring, and technology investments.")
                                                .weightage(20.0)
                                                .build(),
                                PmsKpi.builder()
                                                .assignment(mgrAssignment)
                                                .kpiName("Operational Excellence")
                                                .description("Foster agile best practices, incident retrospectives, and cross-team alignment.")
                                                .weightage(20.0)
                                                .build());
                pmsKpiRepository.saveAll(mgrKpis);
        }

        private void ensureHrAccount() {
                Optional<Employee> hrOpt = employeeRepository.findByEmail("hr@aseuro.com");
                Employee hr;
                if (hrOpt.isPresent()) {
                        hr = hrOpt.get();
                        hr.setPassword(passwordEncoder.encode("Hr@12345"));
                        hr.setRole(Role.ROLE_HR);
                        hr.setAccountStatus("ACTIVE");
                        hr.setFailedLoginAttempts(0);
                        hr.setLockedUntil(null);
                        if (hr.getName() == null || hr.getName().trim().isEmpty() || "Bob HR".equals(hr.getName())) {
                                hr.setName("HR");
                        }
                        if (hr.getEmployeeCode() == null || hr.getEmployeeCode().trim().isEmpty()) {
                                hr.setEmployeeCode("HR-1001");
                        }
                        if (hr.getDepartment() == null || hr.getDepartment().trim().isEmpty()) {
                                hr.setDepartment("Human Resources");
                        }
                        if (hr.getDesignation() == null || hr.getDesignation().trim().isEmpty()) {
                                hr.setDesignation("HR Director");
                        }
                        if (hr.getJoiningDate() == null) {
                                hr.setJoiningDate(LocalDate.of(2022, 1, 15));
                        }
                        employeeRepository.save(hr);
                } else {
                        hr = Employee.builder()
                                        .email("hr@aseuro.com")
                                        .password(passwordEncoder.encode("Hr@12345"))
                                        .name("HR")
                                        .employeeCode("HR-1001")
                                        .department("Human Resources")
                                        .designation("HR Director")
                                        .joiningDate(LocalDate.of(2022, 1, 15))
                                        .accountStatus("ACTIVE")
                                        .failedLoginAttempts(0)
                                        .lockedUntil(null)
                                        .role(Role.ROLE_HR)
                                        .build();
                        employeeRepository.save(hr);
                }

                List<PmsAssignment> hrAssignments = pmsAssignmentRepository.findByEmployee(hr);
                boolean hasAug2026 = hrAssignments.stream()
                                .anyMatch(a -> "August 2026".equals(a.getCycleMonth()));
                if (!hasAug2026) {
                        seedHrAugustAssignment(hr);
                } else {
                        for (PmsAssignment a : hrAssignments) {
                                if ("August 2026".equals(a.getCycleMonth())) {
                                        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(a);
                                        if (kpis.isEmpty()) {
                                                seedHrAugustKpisOnly(a);
                                        }
                                }
                        }
                }
        }
}
