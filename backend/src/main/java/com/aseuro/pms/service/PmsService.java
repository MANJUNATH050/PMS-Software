package com.aseuro.pms.service;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PmsService {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final KpiMasterRepository kpiMasterRepository;

    public PmsService(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository,
            KpiMasterRepository kpiMasterRepository) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
        this.kpiMasterRepository = kpiMasterRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Optional<PmsAssignment> currentAssignmentOpt = pmsAssignmentRepository
                .findFirstByEmployeeOrderByStartDateDesc(employee);

        if (currentAssignmentOpt.isEmpty()) {
            return DashboardResponse.builder()
                    .currentCycle("N/A")
                    .pmsStatus("PMS_NOT_STARTED")
                    .totalKpis(0)
                    .completedKpis(0)
                    .completedWeightage(0.0)
                    .actionRequired("No active PMS cycle assigned to you.")
                    .build();
        }

        PmsAssignment assignment = currentAssignmentOpt.get();
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment).stream()
                .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        int totalKpis = kpis.size();
        int completedKpis = 0;
        double completedWeightage = 0.0;

        for (EmployeeKpiRating rating : ratings) {
            if (rating.getSelfRating() != null) {
                completedKpis++;
                // Find matching KPI weightage
                Optional<PmsKpi> matchedKpi = kpis.stream().filter(k -> k.getId().equals(rating.getKpi().getId()))
                        .findFirst();
                if (matchedKpi.isPresent()) {
                    completedWeightage += matchedKpi.get().getWeightage();
                }
            }
        }

        // Get latest finalized score from history
        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);
        Double latestScore = null;
        String latestGrade = null;
        if (!history.isEmpty()) {
            PmsHistory lastHist = history.get(0);
            latestScore = lastHist.getFinalScore();
            latestGrade = lastHist.getGrade();
        }

        String managerReviewStatus = "Pending";
        String hrReviewStatus = "Pending";
        String actionRequired = "No action required.";

        PMSState state = assignment.getStatus();
        if (state == PMSState.PMS_STARTED || state == PMSState.SELF_ASSESSMENT_DRAFT) {
            actionRequired = "Please complete and submit your self-assessment.";
        } else if (state == PMSState.SELF_ASSESSMENT_SUBMITTED || state == PMSState.MANAGER_REVIEW_PENDING) {
            actionRequired = "No action required. Self-assessment submitted. Awaiting manager review.";
        } else if (state == PMSState.MANAGER_REVIEW_SUBMITTED || state == PMSState.HR_REVIEW_PENDING) {
            managerReviewStatus = "Completed";
            actionRequired = "Awaiting HR review and final publishing.";
        } else if (state == PMSState.HR_REVIEW_COMPLETED || state == PMSState.FINAL_RESULT_PUBLISHED
                || state == PMSState.COMPLETED) {
            managerReviewStatus = "Completed";
            hrReviewStatus = "Completed";
            actionRequired = "PMS completed. You can view your finalized results in History / Reports.";
        }

        return DashboardResponse.builder()
                .currentCycle(assignment.getCycleMonth())
                .pmsStatus(state.name())
                .totalKpis(totalKpis)
                .completedKpis(completedKpis)
                .completedWeightage(completedWeightage)
                .latestFinalizedScore(latestScore)
                .latestFinalizedGrade(latestGrade)
                .managerReviewStatus(managerReviewStatus)
                .hrReviewStatus(hrReviewStatus)
                .actionRequired(actionRequired)
                .build();
    }

    @Transactional
    public PmsAssignmentDto getCurrentAssignment(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(employee);
        PmsAssignment assignment;

        if (assignmentOpt.isPresent()) {
            assignment = assignmentOpt.get();
        } else {
            // Auto-provision fresh August 2026 cycle for this employee
            assignment = PmsAssignment.builder()
                    .employee(employee)
                    .cycleMonth("August 2026")
                    .status(PMSState.SELF_ASSESSMENT_DRAFT)
                    .startDate(LocalDate.of(2026, 8, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .submissionDeadline(LocalDate.of(2026, 9, 10))
                    .build();
            assignment = pmsAssignmentRepository.save(assignment);

            String desig = employee.getDesignation() != null ? employee.getDesignation().trim() : "Software Engineer";
            List<KpiMaster> masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(desig, "ACTIVE");
            if (masterKpis.isEmpty()) {
                masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus("Software Engineer", "ACTIVE");
            }
            if (masterKpis.isEmpty()) {
                masterKpis = kpiMasterRepository.findAll();
            }

            boolean isManagerRole = employee.getRole() == Role.ROLE_MANAGER;
            List<KpiMaster> effectiveKpis = masterKpis.stream().filter(km -> {
                String app = km.getApplicableFor() != null ? km.getApplicableFor().trim() : "Employee";
                if (app.equalsIgnoreCase("Both") || app.equalsIgnoreCase("Both Employee & Manager") || app.toLowerCase().contains("both")) {
                    return true;
                }
                return isManagerRole ? app.equalsIgnoreCase("Manager") : app.equalsIgnoreCase("Employee");
            }).collect(Collectors.toList());

            if (effectiveKpis.isEmpty()) {
                effectiveKpis = masterKpis;
            }

            List<PmsKpi> assignedKpis = new ArrayList<>();
            for (KpiMaster km : effectiveKpis) {
                PmsKpi k = PmsKpi.builder()
                        .assignment(assignment)
                        .kpiName(km.getKpiName())
                        .description(km.getDescription())
                        .weightage(km.getWeightage())
                        .applicableFor(km.getApplicableFor() != null ? km.getApplicableFor() : "Employee")
                        .kpiCategory(km.getKpiCategory() != null ? km.getKpiCategory() : "ROLE_KPI")
                        .build();
                assignedKpis.add(k);
            }
            if (!assignedKpis.isEmpty()) {
                pmsKpiRepository.saveAll(assignedKpis);
            }
        }

        return getAssignmentDto(assignment);
    }

    @Transactional
    public PmsAssignmentDto getAssignmentDetail(Long employeeId, Long assignmentId) {
        Employee reqUser = employeeRepository.findById(employeeId).orElse(null);
        boolean isHrOrManager = reqUser != null && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        // 1. Check if assignmentId is a PmsHistory ID for this employee
        Optional<PmsHistory> historyOpt = pmsHistoryRepository.findById(assignmentId);
        if (historyOpt.isPresent() && (historyOpt.get().getEmployee().getId().equals(employeeId) || isHrOrManager)) {
            PmsHistory h = historyOpt.get();
            PmsAssignment assignment = pmsAssignmentRepository.findByEmployeeAndCycleMonth(h.getEmployee(), h.getCycleMonth())
                    .orElseGet(() -> createHistoricalAssignment(h));
            return getAssignmentDto(assignment);
        }

        // 2. Otherwise look up by assignment ID
        Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findById(assignmentId);
        if (assignmentOpt.isPresent()) {
            PmsAssignment assignment = assignmentOpt.get();
            if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
                throw new AccessDeniedException("Unauthorized access to PMS records");
            }
            return getAssignmentDto(assignment);
        }

        throw new IllegalArgumentException("Assignment not found with ID: " + assignmentId);
    }

    private PmsAssignment createHistoricalAssignment(PmsHistory h) {
        PmsAssignment a = PmsAssignment.builder()
                .employee(h.getEmployee())
                .cycleMonth(h.getCycleMonth())
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 1, 31))
                .finalizedDate(h.getFinalizedDate())
                .overallScore(h.getFinalScore())
                .performanceGrade(h.getGrade())
                .build();
        a = pmsAssignmentRepository.save(a);

        PmsKpi kpi = PmsKpi.builder()
                .assignment(a)
                .kpiName("Sprint Goal Achievement")
                .description("Successfully completed all assigned sprint goals.")
                .weightage(40.0)
                .kpiCategory("ROLE_KPI")
                .build();
        pmsKpiRepository.save(kpi);

        EmployeeKpiRating rating = EmployeeKpiRating.builder()
                .assignment(a)
                .kpi(kpi)
                .selfRating(4.5)
                .comments("Delivered high performance features ahead of deadlines.")
                .status("COMPLETED")
                .build();
        employeeKpiRatingRepository.save(rating);

        // Seed HR review KPIs
        List<KpiMaster> hrMasters = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
        for (KpiMaster m : hrMasters) {
            PmsKpi pk = PmsKpi.builder()
                    .assignment(a)
                    .kpiName(m.getKpiName())
                    .description(m.getDescription())
                    .weightage(m.getWeightage())
                    .applicableFor(m.getApplicableFor())
                    .kpiCategory("HR_REVIEW_KPI")
                    .build();
            pmsKpiRepository.save(pk);

            EmployeeKpiRating r = EmployeeKpiRating.builder()
                    .assignment(a)
                    .kpi(pk)
                    .hrRating(null)
                    .status("HR_PENDING")
                    .build();
            employeeKpiRatingRepository.save(r);
        }

        h.setAssignmentId(a.getId());
        pmsHistoryRepository.save(h);

        return a;
    }

    @Transactional
    public PmsAssignmentDto saveSelfAssessmentDraft(Long employeeId, Long assignmentId, KpiRatingRequest request) {
        PmsAssignment assignment = getEditableAssignment(employeeId, assignmentId);

        if (request.getRatings() != null) {
            for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
                if (entry.getSelfRating() != null && (entry.getSelfRating() < 0.0 || entry.getSelfRating() > 5.0)) {
                    throw new IllegalArgumentException("Rating must be between 0.0 and 5.0");
                }
            }
        }

        updateRatings(assignment, request, "DRAFT");

        assignment.setStatus(PMSState.SELF_ASSESSMENT_DRAFT);
        pmsAssignmentRepository.save(assignment);

        return getAssignmentDto(assignment);
    }

    @Transactional
    public PmsAssignmentDto submitSelfAssessment(Long employeeId, Long assignmentId, KpiRatingRequest request) {
        PmsAssignment assignment = getEditableAssignment(employeeId, assignmentId);

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment).stream()
                .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        if (request.getRatings() == null || request.getRatings().size() < kpis.size()) {
            throw new IllegalArgumentException("All KPIs must be rated before final submission.");
        }

        for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
            if (entry.getSelfRating() == null || entry.getSelfRating() < 0.0 || entry.getSelfRating() > 5.0) {
                throw new IllegalArgumentException("Valid rating (0.0 - 5.0) is required for all KPIs.");
            }
        }

        updateRatings(assignment, request, "SUBMITTED");

        assignment.setStatus(PMSState.SELF_ASSESSMENT_SUBMITTED);
        pmsAssignmentRepository.save(assignment);

        return getAssignmentDto(assignment);
    }

    @Transactional(readOnly = true)
    public List<PmsHistoryDto> getPmsHistory(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);
        List<PmsAssignment> empAssignments = pmsAssignmentRepository.findByEmployee(employee);

        Map<String, PmsHistoryDto> mergedMap = new java.util.LinkedHashMap<>();

        // Add finalized assignments
        for (PmsAssignment a : empAssignments) {
            if (a.getStatus() == PMSState.FINAL_RESULT_PUBLISHED || a.getStatus() == PMSState.COMPLETED) {
                String cycle = a.getCycleMonth() != null ? a.getCycleMonth() : "August 2026";
                LocalDate finDate = a.getFinalizedDate() != null ? a.getFinalizedDate() : LocalDate.now();
                mergedMap.put(cycle, PmsHistoryDto.builder()
                        .id(a.getId())
                        .assignmentId(a.getId())
                        .cycleMonth(cycle)
                        .finalScore(a.getOverallScore())
                        .grade(a.getPerformanceGrade() != null ? a.getPerformanceGrade() : "Completed")
                        .finalizedDate(finDate)
                        .build());
            }
        }

        // Overlay PmsHistory entries
        for (PmsHistory h : history) {
            String cycle = h.getCycleMonth();
            PmsHistoryDto existing = mergedMap.get(cycle);
            if (existing != null) {
                if (existing.getAssignmentId() == null && h.getAssignmentId() != null) {
                    existing.setAssignmentId(h.getAssignmentId());
                }
                if (h.getFinalScore() != null) existing.setFinalScore(h.getFinalScore());
                if (h.getGrade() != null) existing.setGrade(h.getGrade());
                if (h.getFinalizedDate() != null) existing.setFinalizedDate(h.getFinalizedDate());
            } else {
                mergedMap.put(cycle, PmsHistoryDto.builder()
                        .id(h.getId())
                        .assignmentId(h.getAssignmentId() != null ? h.getAssignmentId() : h.getId())
                        .cycleMonth(cycle)
                        .finalScore(h.getFinalScore())
                        .grade(h.getGrade() != null ? h.getGrade() : "Completed")
                        .finalizedDate(h.getFinalizedDate())
                        .filePath(h.getFilePath())
                        .build());
            }
        }

        return new ArrayList<>(mergedMap.values());
    }

    @Transactional(readOnly = true)
    public List<PmsHistoryDto> getHistory(Long employeeId) {
        return getPmsHistory(employeeId);
    }

    // Helper methods
    private PmsAssignment getEditableAssignment(Long employeeId, Long assignmentId) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getEmployee().getId().equals(employeeId)) {
            throw new AccessDeniedException("Unauthorized access to PMS records");
        }

        PMSState state = assignment.getStatus();
        if (state == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                state == PMSState.MANAGER_REVIEW_PENDING ||
                state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.RATING_AND_POINTS_CALCULATED ||
                state == PMSState.FINAL_ANALYSIS ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED) {
            throw new IllegalArgumentException("PMS record is finalized or submitted and cannot be edited.");
        }

        return assignment;
    }

    private void updateRatings(PmsAssignment assignment, KpiRatingRequest request, String status) {
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        Map<Long, PmsKpi> kpiMap = kpis.stream().collect(Collectors.toMap(PmsKpi::getId, k -> k));

        List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = existingRatings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        if (request.getRatings() != null) {
            for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
                PmsKpi kpi = kpiMap.get(entry.getKpiId());
                if (kpi == null) {
                    continue;
                }

                EmployeeKpiRating rating = ratingMap.get(kpi.getId());
                if (rating == null) {
                    rating = EmployeeKpiRating.builder()
                            .assignment(assignment)
                            .kpi(kpi)
                            .build();
                }

                rating.setSelfRating(entry.getSelfRating());
                rating.setComments(entry.getComments());
                rating.setStatus(status);
                employeeKpiRatingRepository.save(rating);
            }
        }
    }

    private PmsAssignmentDto getAssignmentDto(PmsAssignment assignment) {
        Employee emp = assignment.getEmployee();
        EmployeeDto empDto = EmployeeDto.builder()
                .id(emp.getId())
                .name(emp.getName())
                .email(emp.getEmail())
                .department(emp.getDepartment())
                .team(emp.getTeam())
                .designation(emp.getDesignation())
                .managerName(emp.getManager() != null ? emp.getManager().getName() : "N/A")
                .joiningDate(emp.getJoiningDate())
                .accountStatus(emp.getAccountStatus())
                .build();

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        boolean hasHrReviewKpis = allKpis.stream().anyMatch(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()));
        if (!hasHrReviewKpis && kpiMasterRepository != null) {
            List<KpiMaster> masterHrKpis = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
            if (!masterHrKpis.isEmpty()) {
                List<PmsKpi> newHrKpis = new ArrayList<>();
                for (KpiMaster mhk : masterHrKpis) {
                    PmsKpi pk = PmsKpi.builder()
                            .assignment(assignment)
                            .kpiName(mhk.getKpiName())
                            .description(mhk.getDescription())
                            .weightage(mhk.getWeightage())
                            .applicableFor(mhk.getApplicableFor() != null ? mhk.getApplicableFor() : "Both Employee & Manager")
                            .kpiCategory("HR_REVIEW_KPI")
                            .build();
                    newHrKpis.add(pk);
                }
                pmsKpiRepository.saveAll(newHrKpis);
                allKpis = pmsKpiRepository.findByAssignment(assignment);
            }
        }

        List<PmsKpi> roleKpis = allKpis.stream()
                .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());
        List<PmsKpi> hrKpis = allKpis.stream()
                .filter(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = ratings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        List<KpiDto> kpiDtos = roleKpis.stream().map(k -> {
            EmployeeKpiRating r = ratingMap.get(k.getId());
            return KpiDto.builder()
                    .kpiId(k.getId())
                    .kpiName(k.getKpiName())
                    .description(k.getDescription())
                    .weightage(k.getWeightage())
                    .selfRating(r != null ? r.getSelfRating() : null)
                    .managerRating(r != null ? r.getManagerRating() : null)
                    .hrRating(r != null ? r.getHrRating() : null)
                    .comments(r != null ? r.getComments() : null)
                    .employeeComments(r != null ? r.getComments() : null)
                    .employeeComment(r != null ? r.getComments() : null)
                    .managerComments(r != null ? r.getManagerComment() : null)
                    .managerComment(r != null ? r.getManagerComment() : null)
                    .hrComments(r != null ? r.getHrComment() : null)
                    .hrComment(r != null ? r.getHrComment() : null)
                    .ratingStatus(r != null ? r.getStatus() : "PENDING")
                    .build();
        }).collect(Collectors.toList());

        boolean isFinalized = assignment.getStatus() == PMSState.COMPLETED
                || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED
                || assignment.getStatus() == PMSState.HR_REVIEW_COMPLETED;

        List<KpiDto> hrReviewKpiDtos = hrKpis.stream().map(k -> {
            EmployeeKpiRating r = ratingMap.get(k.getId());
            Double hrRat = r != null ? r.getHrRating() : null;
            if (hrRat == null && isFinalized) {
                hrRat = 5.0; // Default finalized evaluation
            }
            String stat = isFinalized ? "FINALIZED" : (r != null && r.getStatus() != null ? r.getStatus() : "PENDING");
            return KpiDto.builder()
                    .kpiId(k.getId())
                    .kpiName(k.getKpiName())
                    .description(k.getDescription())
                    .weightage(k.getWeightage())
                    .selfRating(r != null ? r.getSelfRating() : null)
                    .managerRating(r != null ? r.getManagerRating() : null)
                    .hrRating(hrRat)
                    .comments(r != null ? r.getComments() : null)
                    .employeeComments(r != null ? r.getComments() : null)
                    .employeeComment(r != null ? r.getComments() : null)
                    .managerComments(r != null ? r.getManagerComment() : null)
                    .managerComment(r != null ? r.getManagerComment() : null)
                    .hrComments(r != null ? r.getHrComment() : null)
                    .hrComment(r != null ? r.getHrComment() : null)
                    .ratingStatus(stat)
                    .build();
        }).collect(Collectors.toList());

        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        List<ReviewDto> reviewDtos = reviews.stream().map(r -> ReviewDto.builder()
                .reviewerName(r.getReviewer().getName())
                .reviewerRole(r.getReviewer().getRole().name().replace("ROLE_", ""))
                .comments(r.getComments())
                .reviewDate(r.getReviewDate())
                .build()).collect(Collectors.toList());

        return PmsAssignmentDto.builder()
                .assignmentId(assignment.getId())
                .cycleMonth(assignment.getCycleMonth())
                .status(assignment.getStatus().name())
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .submissionDeadline(assignment.getSubmissionDeadline())
                .overallScore(assignment.getOverallScore())
                .performanceGrade(assignment.getPerformanceGrade())
                .finalizedDate(assignment.getFinalizedDate())
                .employee(empDto)
                .kpis(kpiDtos)
                .hrReviewKpis(hrReviewKpiDtos)
                .reviews(reviewDtos)
                .build();
    }

    @Transactional
    public void resetActiveCycle(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        List<PmsAssignment> assignments = pmsAssignmentRepository.findByEmployee(employee);
        for (PmsAssignment assignment : assignments) {
            if ("August 2026".equals(assignment.getCycleMonth())) {
                assignment.setStatus(PMSState.SELF_ASSESSMENT_DRAFT);
                assignment.setOverallScore(null);
                assignment.setPerformanceGrade(null);
                assignment.setFinalizedDate(null);
                pmsAssignmentRepository.save(assignment);

                List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
                if (!ratings.isEmpty()) {
                    employeeKpiRatingRepository.deleteAll(ratings);
                }
            }
        }
    }
}
