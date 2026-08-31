package com.aseuro.pms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrSaveRatingsRequest {

    @NotNull(message = "Ratings list cannot be null")
    private List<HrKpiRatingEntry> ratings;

    private String hrComments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HrKpiRatingEntry {
        @NotNull(message = "KPI ID is required")
        private Long kpiId;

        private Double hrRating; // 0.0 to 5.0
        private Double managerRating; // 0.0 to 5.0

        private String comments;

        public HrKpiRatingEntry(Long kpiId, Double hrRating, String comments) {
            this.kpiId = kpiId;
            this.hrRating = hrRating;
            this.comments = comments;
        }
    }
}
