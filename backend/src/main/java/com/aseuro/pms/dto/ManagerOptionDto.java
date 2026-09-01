package com.aseuro.pms.dto;

public record ManagerOptionDto(
        Long id,
        String fullName,
        String employeeCode,
        String email,
        String designationName,
        Long reportingManagerId,
        String reportingManagerName
) {
    public ManagerOptionDto(Long id, String fullName, String employeeCode, String email, String designationName) {
        this(id, fullName, employeeCode, email, designationName, null, null);
    }
}
