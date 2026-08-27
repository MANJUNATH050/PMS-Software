package com.aseuro.pms.dto;

public record DepartmentDto(
        Long id,
        String name,
        String description,
        String status
) {}
