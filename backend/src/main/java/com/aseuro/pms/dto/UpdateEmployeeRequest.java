package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {
    private String role;
    private String designation;
    private String department;
    private String team;
    private Long managerId;
    private String accountStatus;
    private String employeeCode;
}
