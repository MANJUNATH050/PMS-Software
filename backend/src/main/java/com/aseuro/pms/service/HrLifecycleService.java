package com.aseuro.pms.service;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HrLifecycleService {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final KpiMasterRepository kpiMasterRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;

    public HrLifecycleService(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            KpiMasterRepository kpiMasterRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.kpiMasterRepository = kpiMasterRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> searchEmployees(String query) {
        List<Employee> list = employeeRepository.findAll();
        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            list = list.stream().filter(e ->
                    (e.getName() != null && e.getName().toLowerCase().contains(q)) ||
                    (e.getEmail() != null && e.getEmail().toLowerCase().contains(q)) ||
                    (e.getDesignation() != null && e.getDesignation().toLowerCase().contains(q)) ||
                    ("EMP-" + e.getId()).toLowerCase().contains(q)
            ).collect(Collectors.toList());
        }

        return list.stream().map(e -> EmployeeDto.builder()
                .id(e.getId())
                .name(e.getName())
                .email(e.getEmail())
                .department(e.getDepartment() != null ? e.getDepartment() : "-")
                .team(e.getTeam() != null ? e.getTeam() : "-")
                .designation(e.getDesignation() != null ? e.getDesignation() : "-")
                .managerName(e.getManager() != null ? e.getManager().getName() : "-")
                .joiningDate(e.getJoiningDate())
                .accountStatus(e.getAccountStatus() != null ? e.getAccountStatus() : "ACTIVE")
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> getEmployeeLifecycle(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

        Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(employee);

        Map<String, Object> response = new HashMap<>();

        EmployeeDto empDto = EmployeeDto.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .department(employee.getDepartment() != null ? employee.getDepartment() : "-")
                .team(employee.getTeam() != null ? employee.getTeam() : "-")
                .designation(employee.getDesignation() != null ? employee.getDesignation() : "-")
                .managerName(employee.getManager() != null ? employee.getManager().getName() : "-")
                .joiningDate(employee.getJoiningDate())
                .accountStatus(employee.getAccountStatus())
                .build();
        response.put("employee", empDto);

        if (assignmentOpt.isEmpty()) {
            response.put("hasActiveAssignment", false);
            response.put("workflowStages", buildDefaultWorkflowStages(PMSState.PMS_NOT_STARTED));
            response.put("kpis", Collections.emptyList());
            return response;
        }

        PmsAssignment assignment = assignmentOpt.get();
        response.put("hasActiveAssignment", true);
        response.put("assignmentId", assignment.getId());
        response.put("cycleMonth", assignment.getCycleMonth());
        response.put("status", assignment.getStatus().name());
        response.put("startDate", assignment.getStartDate());
        response.put("endDate", assignment.getEndDate());
        response.put("submissionDeadline", assignment.getSubmissionDeadline());
        response.put("overallScore", assignment.getOverallScore());
        response.put("performanceGrade", assignment.getPerformanceGrade());
        response.put("finalizedDate", assignment.getFinalizedDate());

        // Stage progression map
        response.put("workflowStages", buildDefaultWorkflowStages(assignment.getStatus()));

        // KPIs and ratings
        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        boolean hasHrReviewKpis = allKpis.stream().anyMatch(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()));
        if (!hasHrReviewKpis) {
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

        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        List<Map<String, Object>> roleKpiList = new ArrayList<>();
        List<Map<String, Object>> hrReviewKpiList = new ArrayList<>();
        List<Map<String, Object>> allKpiList = new ArrayList<>();

        double selfWeightedSum = 0.0;
        double managerWeightedSum = 0.0;
        double hrWeightedSum = 0.0;
        boolean hasSelf = false;
        boolean hasManager = false;
        boolean hasHr = false;

        for (PmsKpi kpi : allKpis) {
            EmployeeKpiRating r = ratings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);

            boolean isHrKpi = "HR_REVIEW_KPI".equals(kpi.getKpiCategory());

            Map<String, Object> km = new HashMap<>();
            km.put("kpiId", kpi.getId());
            km.put("kpiName", kpi.getKpiName());
            km.put("description", kpi.getDescription());
            km.put("weightage", kpi.getWeightage());
            km.put("kpiCategory", kpi.getKpiCategory() != null ? kpi.getKpiCategory() : "ROLE_KPI");
            km.put("selfRating", r != null ? r.getSelfRating() : null);
            km.put("managerRating", r != null ? r.getManagerRating() : null);
            km.put("hrRating", r != null ? r.getHrRating() : null);
            km.put("comments", r != null ? r.getComments() : null);
            km.put("ratingStatus", r != null ? r.getStatus() : "PENDING");

            double wFactor = kpi.getWeightage() / 100.0;

            if (!isHrKpi) {
                if (r != null && r.getSelfRating() != null) {
                    selfWeightedSum += r.getSelfRating() * wFactor;
                    hasSelf = true;
                }
                if (r != null && r.getManagerRating() != null) {
                    managerWeightedSum += r.getManagerRating() * wFactor;
                    hasManager = true;
                }
                roleKpiList.add(km);
            } else {
                if (r != null && r.getHrRating() != null) {
                    hrWeightedSum += r.getHrRating() * wFactor;
                    hasHr = true;
                }
                hrReviewKpiList.add(km);
            }

            allKpiList.add(km);
        }

        response.put("kpis", allKpiList);
        response.put("roleKpis", roleKpiList);
        response.put("hrReviewKpis", hrReviewKpiList);

        Double selfScore = hasSelf ? Math.round(selfWeightedSum * 100.0) / 100.0 : null;
        Double managerScore = hasManager ? Math.round(managerWeightedSum * 100.0) / 100.0 : null;
        Double hrScore = hasHr ? Math.round(hrWeightedSum * 100.0) / 100.0 : null;

        Double finalCalculatedScore = null;
        if (hasManager && hasHr) {
            finalCalculatedScore = Math.round(((managerScore + hrScore) / 2.0) * 100.0) / 100.0;
        } else if (hasHr) {
            finalCalculatedScore = hrScore;
        } else if (hasManager) {
            finalCalculatedScore = managerScore;
        }

        response.put("employeeSelfScore", selfScore);
        response.put("managerWeightedScore", managerScore);
        response.put("hrWeightedScore", hrScore);
        response.put("calculatedScore", finalCalculatedScore);

        // Reviews
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        response.put("reviews", reviews.stream().map(rev -> Map.of(
                "reviewerName", rev.getReviewer().getName(),
                "reviewerRole", rev.getReviewer().getRole().name().replace("ROLE_", ""),
                "comments", rev.getComments() != null ? rev.getComments() : "",
                "reviewDate", rev.getReviewDate() != null ? rev.getReviewDate().toString() : ""
        )).collect(Collectors.toList()));

        // History
        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);
        response.put("history", history.stream().map(h -> Map.of(
                "id", h.getId(),
                "cycleMonth", h.getCycleMonth(),
                "finalScore", h.getFinalScore(),
                "grade", h.getGrade(),
                "finalizedDate", h.getFinalizedDate() != null ? h.getFinalizedDate().toString() : ""
        )).collect(Collectors.toList()));

        return response;
    }

    @Transactional
    public Map<String, Object> saveHrRatings(Long assignmentId, Long hrEmployeeId, HrSaveRatingsRequest request) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PMS Assignment not found"));

        if (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PMS record is already finalized and cannot be modified.");
        }

        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "HR user not found"));

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        Map<Long, PmsKpi> kpiMap = kpis.stream().collect(Collectors.toMap(PmsKpi::getId, k -> k));

        List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = existingRatings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        if (request.getRatings() != null) {
            for (HrSaveRatingsRequest.HrKpiRatingEntry entry : request.getRatings()) {
                PmsKpi kpi = kpiMap.get(entry.getKpiId());
                if (kpi == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid KPI ID " + entry.getKpiId() + " for this assignment");
                }

                if (entry.getHrRating() != null && (entry.getHrRating() < 0.0 || entry.getHrRating() > 5.0)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "HR Rating must be between 0.0 and 5.0 for KPI ID " + entry.getKpiId());
                }

                if (entry.getManagerRating() != null && (entry.getManagerRating() < 0.0 || entry.getManagerRating() > 5.0)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Manager Rating must be between 0.0 and 5.0 for KPI ID " + entry.getKpiId());
                }

                EmployeeKpiRating rating = ratingMap.get(entry.getKpiId());
                if (rating == null) {
                    rating = EmployeeKpiRating.builder()
                            .assignment(assignment)
                            .kpi(kpi)
                            .build();
                }

                if (entry.getHrRating() != null) {
                    rating.setHrRating(entry.getHrRating());
                }
                if (entry.getManagerRating() != null) {
                    rating.setManagerRating(entry.getManagerRating());
                }
                if (entry.getComments() != null && !entry.getComments().trim().isEmpty()) {
                    rating.setComments(entry.getComments().trim());
                }
                rating.setStatus("HR_REVIEWED");
                employeeKpiRatingRepository.save(rating);
            }
        }

        // Save HR general remarks if provided
        if (request.getHrComments() != null && !request.getHrComments().trim().isEmpty()) {
            LocalDate today = LocalDate.now();
            EmployeeReview review = employeeReviewRepository.findByAssignment(assignment).stream()
                    .filter(rev -> rev.getReviewer().getId().equals(hrEmployeeId))
                    .findFirst()
                    .orElseGet(() -> EmployeeReview.builder()
                            .assignment(assignment)
                            .reviewer(hr)
                            .build());

            review.setComments(request.getHrComments().trim());
            review.setReviewDate(today);
            employeeReviewRepository.save(review);
        }

        return Map.of(
                "message", "HR ratings saved successfully.",
                "assignmentId", assignment.getId()
        );
    }

    @Transactional
    public Map<String, Object> finalizePms(Long assignmentId, Long hrEmployeeId, HrFinalizeRequest request) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PMS Assignment not found"));

        if (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PMS record has already been finalized and locked.");
        }

        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "HR user not found"));

        List<PmsKpi> allKpis = pmsKpiRepository.findByAssignment(assignment);
        if (allKpis.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot finalize PMS with no assigned KPIs.");
        }

        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = ratings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        List<PmsKpi> roleKpis = allKpis.stream()
                .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        List<PmsKpi> hrReviewKpis = allKpis.stream()
                .filter(k -> "HR_REVIEW_KPI".equals(k.getKpiCategory()))
                .collect(Collectors.toList());

        // Validate Role KPIs: Self rating must exist
        for (PmsKpi kpi : roleKpis) {
            EmployeeKpiRating r = ratingMap.get(kpi.getId());
            if (r == null || r.getSelfRating() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Self assessment ratings are incomplete for KPI: " + kpi.getKpiName());
            }
        }

        // Validate HR Review KPIs: All HR Review ratings must be completed before finalization
        for (PmsKpi kpi : hrReviewKpis) {
            EmployeeKpiRating r = ratingMap.get(kpi.getId());
            if (r == null || r.getHrRating() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Please complete all HR Review KPI ratings before finalizing the PMS (Missing for: " + kpi.getKpiName() + ").");
            }
        }

        // Calculate dynamic weighted scores: Employee Self Rating is strictly excluded from Final Result
        double managerWeightedSum = 0.0;
        for (PmsKpi kpi : roleKpis) {
            EmployeeKpiRating r = ratingMap.get(kpi.getId());
            double wFactor = kpi.getWeightage() / 100.0;
            if (r != null && r.getManagerRating() != null) {
                managerWeightedSum += r.getManagerRating() * wFactor;
            }
        }

        double hrWeightedSum = 0.0;
        for (PmsKpi kpi : hrReviewKpis) {
            EmployeeKpiRating r = ratingMap.get(kpi.getId());
            double wFactor = kpi.getWeightage() / 100.0;
            if (r != null && r.getHrRating() != null) {
                hrWeightedSum += r.getHrRating() * wFactor;
            }
        }

        double managerWeightedScore = Math.round(managerWeightedSum * 100.0) / 100.0;
        double hrWeightedScore = Math.round(hrWeightedSum * 100.0) / 100.0;
        double calculatedScore;

        if (managerWeightedSum > 0 && hrWeightedSum > 0) {
            calculatedScore = Math.round(((managerWeightedScore + hrWeightedScore) / 2.0) * 100.0) / 100.0;
        } else if (hrWeightedSum > 0) {
            calculatedScore = hrWeightedScore;
        } else if (managerWeightedSum > 0) {
            calculatedScore = managerWeightedScore;
        } else {
            calculatedScore = 0.0;
        }

        Double finalScore = request.getOverallScore() != null && request.getOverallScore() > 0 ? request.getOverallScore() : calculatedScore;

        String grade = request.getPerformanceGrade();
        if (grade == null || grade.trim().isEmpty()) {
            if (finalScore >= 4.5) grade = "Outstanding Performance";
            else if (finalScore >= 4.0) grade = "Excellent Performance";
            else if (finalScore >= 3.5) grade = "Very Good Performance";
            else if (finalScore >= 3.0) grade = "Good Performance";
            else if (finalScore >= 2.0) grade = "Needs Improvement";
            else grade = "Unsatisfactory";
        }

        LocalDate today = LocalDate.now();

        assignment.setStatus(PMSState.COMPLETED);
        assignment.setOverallScore(finalScore);
        assignment.setPerformanceGrade(grade);
        assignment.setFinalizedDate(today);
        pmsAssignmentRepository.save(assignment);

        // Save FinalPmsResult
        FinalPmsResult result = FinalPmsResult.builder()
                .assignment(assignment)
                .finalScore(finalScore)
                .grade(grade)
                .finalizedBy(hr)
                .finalizedDate(today)
                .build();
        finalPmsResultRepository.save(result);

        // Save PmsHistory
        PmsHistory history = PmsHistory.builder()
                .employee(assignment.getEmployee())
                .assignmentId(assignment.getId())
                .cycleMonth(assignment.getCycleMonth())
                .finalScore(finalScore)
                .grade(grade)
                .finalizedDate(today)
                .build();
        pmsHistoryRepository.save(history);

        // Add HR review comment if provided
        if (request.getHrComments() != null && !request.getHrComments().trim().isEmpty()) {
            EmployeeReview review = EmployeeReview.builder()
                    .assignment(assignment)
                    .reviewer(hr)
                    .comments(request.getHrComments().trim())
                    .reviewDate(today)
                    .build();
            employeeReviewRepository.save(review);
        }

        return Map.of(
                "message", "PMS successfully finalized and published.",
                "assignmentId", assignment.getId(),
                "finalScore", finalScore,
                "grade", grade,
                "status", "COMPLETED"
        );
    }

    @Transactional(readOnly = true)
    public HrReportSummaryDto getRatingCategorySummary() {
        List<PmsHistory> allHistory = pmsHistoryRepository.findAll();

        long excellentCount = 0;
        long veryGoodCount = 0;
        long goodCount = 0;
        long needsImpCount = 0;
        long poorCount = 0;

        double sumScores = 0.0;

        for (PmsHistory h : allHistory) {
            double score = h.getFinalScore() != null ? h.getFinalScore() : 0.0;
            sumScores += score;
            if (score >= 4.2) excellentCount++;
            else if (score >= 3.8) veryGoodCount++;
            else if (score >= 3.0) goodCount++;
            else if (score >= 2.0) needsImpCount++;
            else poorCount++;
        }

        long total = allHistory.size();
        List<HrReportSummaryDto.RatingCategoryDto> cats = new ArrayList<>();

        cats.add(new HrReportSummaryDto.RatingCategoryDto("Excellent", excellentCount, total > 0 ? Math.round((excellentCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Very Good", veryGoodCount, total > 0 ? Math.round((veryGoodCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Good", goodCount, total > 0 ? Math.round((goodCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Needs Improvement", needsImpCount, total > 0 ? Math.round((needsImpCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Poor", poorCount, total > 0 ? Math.round((poorCount * 100.0 / total) * 10.0) / 10.0 : 0.0));

        return HrReportSummaryDto.builder()
                .categories(cats)
                .totalFinalizedRecords(total)
                .averageScore(total > 0 ? Math.round((sumScores / total) * 100.0) / 100.0 : null)
                .build();
    }

    private List<Map<String, Object>> buildDefaultWorkflowStages(PMSState state) {
        List<Map<String, Object>> stages = new ArrayList<>();

        // 1. Self Assessment
        boolean selfStarted = state != PMSState.PMS_NOT_STARTED;
        boolean selfSubmitted = state == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                state == PMSState.MANAGER_REVIEW_PENDING ||
                state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 1,
                "title", "Self Assessment",
                "status", selfSubmitted ? "Completed" : (selfStarted ? "In Progress" : "Not Started")
        ));

        // 2. Submitted
        stages.add(Map.of(
                "step", 2,
                "title", "Submitted",
                "status", selfSubmitted ? "Completed" : "Not Started"
        ));

        // 3. Manager Review
        boolean managerSubmitted = state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 3,
                "title", "Manager Review",
                "status", managerSubmitted ? "Completed" : (selfSubmitted ? "Pending" : "Not Started")
        ));

        // 4. HR Review
        boolean hrDone = state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 4,
                "title", "HR Review",
                "status", hrDone ? "Completed" : (managerSubmitted ? "Pending" : "Not Started")
        ));

        // 5. Final Result
        boolean finalDone = state == PMSState.FINAL_RESULT_PUBLISHED || state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 5,
                "title", "Final Result",
                "status", finalDone ? "Completed" : "Not Started"
        ));

        return stages;
    }
}
