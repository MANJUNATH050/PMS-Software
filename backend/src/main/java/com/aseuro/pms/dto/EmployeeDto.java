package com.aseuro.pms.dto;

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
