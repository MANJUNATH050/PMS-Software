package com.aseuro.pms.dto;

import com.aseuro.pms.entity.UserRole;

public record AuthResponse(
        String token,
        String email,
        UserRole role,
        String fullName,
        String employeeCode,
        String message
) {
    public AuthResponse(String token, String email, UserRole role, String message) {
        this(token, email, role, null, null, message);
    }
}
