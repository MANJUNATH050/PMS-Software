package com.aseuro.pms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class ReviewDto {
    private String reviewerName;
    private String reviewerRole;
    private String comments;
    private LocalDate reviewDate;
}
