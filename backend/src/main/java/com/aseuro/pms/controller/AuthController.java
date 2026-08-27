package com.aseuro.pms.controller;

<<<<<<< HEAD
import com.aseuro.pms.dto.ForgotPasswordRequest;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.LoginResponse;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.security.JwtTokenProvider;
import com.aseuro.pms.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, EmployeeRepository employeeRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email address is required."));
        }

        if (employeeRepository.findByEmail(loginRequest.getEmail()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email ID."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            return ResponseEntity.ok(new LoginResponse(
                    jwt,
                    "Bearer",
                    userPrincipal.getUsername(),
                    userPrincipal.getEmployee().getName(),
                    userPrincipal.getEmployee().getRole().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account with " + forgotPasswordRequest.getEmail() + " exists, a password reset link has been sent.");
        return ResponseEntity.ok(response);
=======
import com.aseuro.pms.dto.AuthResponse;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.ResetPasswordRequest;
import com.aseuro.pms.entity.User;
import com.aseuro.pms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal User principal) {
        return ResponseEntity.ok(Map.of(
                "id", principal.getId(),
                "email", principal.getEmail(),
                "role", principal.getRole().name(),
                "status", principal.getStatus().name()
        ));
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
    }
}
