package com.company.pms.service;

import com.company.pms.dto.Dtos.*;
import com.company.pms.entity.*;
import com.company.pms.exception.ApiException;
import com.company.pms.repository.*;
import com.company.pms.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final EmployeeRepository employees;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository u, EmployeeRepository e, PasswordEncoder p, JwtService j) {
        users = u;
        employees = e;
        encoder = p;
        jwt = j;
    }

    public LoginResponse login(LoginRequest request) {
        User u = users.findByIdentifier(request.identifier().trim())
                .orElseThrow(() -> new ApiException(401, "Invalid email/employee ID or password."));
        
        if (u.getStatus() != RecordStatus.ACTIVE || !encoder.matches(request.password(), u.getPasswordHash()))
            throw new ApiException(401, "Invalid email/employee ID or password.");
        
        var employee = employees.findByEmailIgnoreCase(u.getEmail()).orElse(null);
        
        return new LoginResponse(jwt.generate(u.getEmail(), u.getRole().name()), "Bearer",
                new UserResponse(u.getId(), employee == null ? null : employee.getEmployeeCode(),
                        employee == null ? u.getUsername() : employee.getFullName(), u.getEmail(), u.getRole().name()));
    }
}
