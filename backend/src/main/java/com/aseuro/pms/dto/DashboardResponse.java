package com.aseuro.pms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    private String currentCycle;
    private String pmsStatus; // e.g., "SELF_ASSESSMENT_PENDING", "SELF_ASSESSMENT_SUBMITTED", etc.
    private int totalKpis;
    private int completedKpis; // self-rated KPIs
    private double completedWeightage; // sum of weightage of rated KPIs
    private Double latestFinalizedScore;
    private String latestFinalizedGrade;
    private String managerReviewStatus; // "Pending" or "Completed"
    private String hrReviewStatus; // "Pending" or "Completed"
    private String actionRequired;
}
