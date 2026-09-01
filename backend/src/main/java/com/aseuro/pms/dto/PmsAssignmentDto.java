package com.aseuro.pms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class PmsAssignmentDto {
    private Long assignmentId;
    private String cycleMonth;
    private String status; // PMSState as string
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate submissionDeadline;
    private Double overallScore;
    private String performanceGrade;
    private LocalDate finalizedDate;
    private EmployeeDto employee;
    private List<KpiDto> kpis;
    private List<KpiDto> hrReviewKpis;
    private List<ReviewDto> reviews;
}
