package com.aseuro.pms.service;

import com.aseuro.pms.model.EmployeeKpiRating;
import com.aseuro.pms.model.PmsKpi;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PmsScoreCalculatorService {

    public static final double HR_WEIGHTAGE_PERCENT = 25.0;
    public static final double NON_HR_WEIGHTAGE_PERCENT = 75.0;

    /**
     * Calculates component scores and final overall score according to the 25% HR / 75% Non-HR rule.
     */
    public CalculationResult calculateScores(List<PmsKpi> allKpis, List<EmployeeKpiRating> ratings) {
        Map<Long, EmployeeKpiRating> ratingMap = ratings.stream()
                .filter(r -> r.getKpi() != null)
                .collect(java.util.stream.Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        double roleKpiSelfSum = 0.0;
        double roleKpiManagerSum = 0.0;
        double hrKpiHrSum = 0.0;

        boolean hasSelf = false;
        boolean hasManager = false;
        boolean hasHr = false;

        for (PmsKpi kpi : allKpis) {
            EmployeeKpiRating r = ratingMap.get(kpi.getId());
            boolean isHrKpi = "HR_REVIEW_KPI".equalsIgnoreCase(kpi.getKpiCategory());
            double wFactor = (kpi.getWeightage() != null ? kpi.getWeightage() : 0.0) / 100.0;

            if (!isHrKpi) {
                if (r != null && r.getSelfRating() != null) {
                    roleKpiSelfSum += r.getSelfRating() * wFactor;
                    hasSelf = true;
                }
                if (r != null && r.getManagerRating() != null) {
                    roleKpiManagerSum += r.getManagerRating() * wFactor;
                    hasManager = true;
                }
            } else {
                if (r != null && r.getHrRating() != null) {
                    hrKpiHrSum += r.getHrRating() * wFactor;
                    hasHr = true;
                }
            }
        }

        Double selfScore = hasSelf ? roundTwoDecimals(roleKpiSelfSum) : null;
        Double managerScore = hasManager ? roundTwoDecimals(roleKpiManagerSum) : null;
        Double hrScore = hasHr ? roundTwoDecimals(hrKpiHrSum) : null;

        Double finalCalculatedScore = null;

        if (hasManager && hasHr) {
            // 75% Manager + 25% HR
            double nonHrContribution = roleKpiManagerSum * (NON_HR_WEIGHTAGE_PERCENT / 100.0);
            double hrContribution = hrKpiHrSum * (HR_WEIGHTAGE_PERCENT / 100.0);
            finalCalculatedScore = roundTwoDecimals(nonHrContribution + hrContribution);
        } else if (hasSelf && hasHr && !hasManager) {
            // 75% Self + 25% HR
            double nonHrContribution = roleKpiSelfSum * (NON_HR_WEIGHTAGE_PERCENT / 100.0);
            double hrContribution = hrKpiHrSum * (HR_WEIGHTAGE_PERCENT / 100.0);
            finalCalculatedScore = roundTwoDecimals(nonHrContribution + hrContribution);
        } else if (hasHr) {
            finalCalculatedScore = hrScore;
        } else if (hasManager) {
            finalCalculatedScore = managerScore;
        } else if (hasSelf) {
            finalCalculatedScore = selfScore;
        }

        String grade = determineGrade(finalCalculatedScore);

        return new CalculationResult(selfScore, managerScore, hrScore, finalCalculatedScore, grade);
    }

    public String determineGrade(Double score) {
        if (score == null) return "Pending Review";
        if (score >= 4.5) return "Exceptional Performance";
        if (score >= 4.0) return "Exceeds Expectations";
        if (score >= 3.0) return "Meets Expectations";
        if (score >= 2.0) return "Below Expectations";
        return "Needs Immediate Improvement";
    }

    private double roundTwoDecimals(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    public record CalculationResult(
            Double selfScore,
            Double managerScore,
            Double hrScore,
            Double finalScore,
            String grade
    ) {}
}
