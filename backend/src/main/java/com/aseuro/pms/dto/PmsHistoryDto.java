package com.aseuro.pms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class PmsHistoryDto {
    private Long id;
    private Long assignmentId;
    private String cycleMonth;
    private Double finalScore;
    private String grade;
    private LocalDate finalizedDate;
    private String filePath;
}
