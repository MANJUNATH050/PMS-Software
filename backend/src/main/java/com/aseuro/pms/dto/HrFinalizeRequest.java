package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrFinalizeRequest {
    private Double overallScore;
    private String performanceGrade;
    private String hrComments;
}
