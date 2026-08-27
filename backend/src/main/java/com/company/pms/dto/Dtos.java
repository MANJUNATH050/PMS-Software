package com.company.pms.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public final class Dtos {
    private Dtos() {
    }

    public record LoginRequest(@NotBlank String identifier, @NotBlank String password) {
    }

    public record LoginResponse(String accessToken, String tokenType, UserResponse user) {
    }

    public record UserResponse(Long id, String employeeCode, String name, String email, String role) {
    }

    public record DashboardSummaryResponse(long totalEmployees, long activeEmployees, long newEmployees,
            long pendingReviews) {
    }

    public record EmployeeCreateRequest(@NotBlank @Size(max = 30) String employeeCode,
            @NotBlank @Size(max = 160) String fullName, @NotBlank @Email String email,
            @NotBlank @Size(min = 4, max = 100) String password,
            com.company.pms.entity.UserRole role,
            @NotNull Long departmentId,
            Long teamId, @NotNull Long designationId, Long managerId, @NotNull LocalDate joiningDate,
            com.company.pms.entity.RecordStatus status) {
    }

    public record EmployeeResponse(Long id, String employeeCode, String fullName, String email, String status) {
    }

    public record KpiCreateRequest(Long designationId, @NotBlank String kpiName, @NotNull Double measurementPercent, Double selfRatingDefault, Double managerRatingDefault, String description) {
    }

    public record KpiResponse(Long id, Long designationId, String kpiName, Double measurementPercent, Double selfRatingDefault, Double managerRatingDefault, String description) {
    }

    public record ManagerCreateRequest(@NotBlank String fullName, @NotBlank @Email String email, @NotBlank String password, Long departmentId, Long designationId) {
    }

    public record KpiRatingDto(Long kpiId, Double selfRating, Double managerRating, Double hrRating) {
    }

    public record PmsFinalizeRequest(@NotNull Long employeeId, String evaluationMonth, List<KpiRatingDto> ratings) {
    }
}
