package com.aseuro.pms.dto;

import com.aseuro.pms.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateEmployeeRequest(
        @NotBlank(message = "Employee code is required")
        String employeeCode,

        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        String password,

        @NotNull(message = "Role is required (EMPLOYEE or MANAGER)")
        UserRole role,

        @NotNull(message = "Department is required")
        Long departmentId,

        @NotNull(message = "Designation is required")
        Long designationId,

        Long teamId,

        Long managerId,

        @NotNull(message = "Joining date is required")
        LocalDate joiningDate
) {}
