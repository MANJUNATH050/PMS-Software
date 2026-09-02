package com.aseuro.pms.controller;

import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.LoginResponse;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.Role;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.security.JwtTokenProvider;
import com.aseuro.pms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HrAuthenticationTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private AuthController authController;

    private PasswordEncoder passwordEncoder;
    private Employee hrEmployee;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        String encodedPassword = passwordEncoder.encode("Hr@12345");

        hrEmployee = Employee.builder()
                .id(2L)
                .email("hr@aseuro.com")
                .name("Bob HR")
                .password(encodedPassword)
                .role(Role.ROLE_HR)
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .lockedUntil(null)
                .build();
    }

    @Test
    void testHrPasswordMatchesBCryptEncoding() {
        assertTrue(passwordEncoder.matches("Hr@12345", hrEmployee.getPassword()),
                "BCrypt encoded password must match Hr@12345");
        assertFalse(passwordEncoder.matches("WrongPassword", hrEmployee.getPassword()),
                "Wrong password must not match");
    }

    @Test
    void testHrSuccessfulLoginReturnsTokenAndHrRole() {
        when(employeeRepository.findByEmail("hr@aseuro.com")).thenReturn(Optional.of(hrEmployee));

        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(hrEmployee);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("jwt.token.for.hr");

        LoginRequest request = new LoginRequest("hr@aseuro.com", "Hr@12345", "HR");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof LoginResponse);

        LoginResponse loginResponse = (LoginResponse) response.getBody();
        assertEquals("jwt.token.for.hr", loginResponse.getToken());
        assertEquals("hr@aseuro.com", loginResponse.getEmail());
        assertEquals("Bob HR", loginResponse.getName());
        assertEquals("ROLE_HR", loginResponse.getRole());
    }

    @Test
    void testHrLoginWithInactiveStatusFails() {
        hrEmployee.setAccountStatus("INACTIVE");
        when(employeeRepository.findByEmail("hr@aseuro.com")).thenReturn(Optional.of(hrEmployee));

        LoginRequest request = new LoginRequest("hr@aseuro.com", "Hr@12345", "HR");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
