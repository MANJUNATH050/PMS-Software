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

        private Double selfRating; // 1.0 to 5.0
        private Double managerRating; // 1.0 to 5.0
        private Double hrRating; // 1.0 to 5.0

        private String selfComment;
        private String employeeComment;
        private String managerComment;
        private String comments;
        private String hrComments;

        public String getEffectiveSelfComments() {
            if (selfComment != null && !selfComment.trim().isEmpty()) {
                return selfComment.trim();
            }
            if (employeeComment != null && !employeeComment.trim().isEmpty()) {
                return employeeComment.trim();
            }
            return null;
        }

        public String getEffectiveManagerComments() {
            if (managerComment != null && !managerComment.trim().isEmpty()) {
                return managerComment.trim();
            }
            return null;
        }

        public String getEffectiveHrComments() {
            if (hrComments != null && !hrComments.trim().isEmpty()) {
                return hrComments.trim();
            }
            if (comments != null && !comments.trim().isEmpty()) {
                return comments.trim();
            }
            return null;
        }

        public HrKpiRatingEntry(Long kpiId, Double hrRating, String comments) {
            this.kpiId = kpiId;
            this.hrRating = hrRating;
            this.comments = comments;
            this.hrComments = comments;
        }

        public HrKpiRatingEntry(Long kpiId, Double hrRating, Double managerRating, String comments) {
            this.kpiId = kpiId;
            this.hrRating = hrRating;
            this.managerRating = managerRating;
            this.comments = comments;
            this.hrComments = comments;
        }
    }
}
