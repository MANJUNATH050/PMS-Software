package com.aseuro.pms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KpiDto {
    private Long kpiId;
    private String kpiName;
    private String description;
    private Double weightage; // percentage, e.g. 20.0
    private Double selfRating; // 0.0 to 5.0
    private Double managerRating; // 0.0 to 5.0
    private Double hrRating; // 0.0 to 5.0
    private String comments; // Employee comment
    private String employeeComments; // Alias for employee comment
    private String managerComments; // Manager comment
    private String hrComments; // HR comment
    private String ratingStatus; // "DRAFT", "SUBMITTED", "COMPLETED", "PENDING"
}
