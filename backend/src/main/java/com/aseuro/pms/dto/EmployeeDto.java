package com.aseuro.pms.dto;

import java.time.Instant;
import java.time.LocalDate;

public record EmployeeDto(
        Long id,
        Long userId,
        String employeeCode,
        String fullName,
        String email,
        String role,
        Long departmentId,
        String departmentName,
        Long designationId,
        String designationName,
        Long managerId,
        String managerName,
        LocalDate joiningDate,
        String status,
        Instant createdAt
) {}
