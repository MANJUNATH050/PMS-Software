package com.aseuro.pms.dto;

import lombok.Data;
import java.util.List;

@Data
public class KpiRatingRequest {
    private List<KpiRatingEntry> ratings;

    @Data
    public static class KpiRatingEntry {
        private Long kpiId;
        private Double selfRating; // 0.0 to 5.0
        private String comments;
    }
}
