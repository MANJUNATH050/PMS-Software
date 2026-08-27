package com.aseuro.pms.dto;

<<<<<<< HEAD
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class EmployeeDto {
    private Long id;
    private String name;
    private String email;
    private String department;
    private String team;
    private String designation;
    private String managerName;
    private LocalDate joiningDate;
    private String accountStatus;
}
=======
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
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
