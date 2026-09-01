package com.aseuro.pms.controller;

import com.aseuro.pms.dto.LoginRequest;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private AuthController authController;

    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .id(1L)
                .email("employee@aseuro.com")
                .name("John Doe")
                .password("$2a$10$encodedPassword")
                .role(Role.ROLE_EMPLOYEE)
                .accountStatus("ACTIVE")
                .failedLoginAttempts(0)
                .lockedUntil(null)
                .build();
    }

    @Test
    void testSuccessfulLogin_ResetsFailedAttempts() {
        employee.setFailedLoginAttempts(3);
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));

        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(1L);
        when(principal.getUsername()).thenReturn("employee@aseuro.com");
        when(principal.getEmployee()).thenReturn(employee);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("mock.jwt.token");

        LoginRequest request = new LoginRequest("employee@aseuro.com", "password", "EMPLOYEE");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(0, employee.getFailedLoginAttempts());
        assertNull(employee.getLockedUntil());
        verify(employeeRepository).save(employee);
    }

    @Test
    void testFailedLogin_IncrementsFailedAttempts() {
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest("employee@aseuro.com", "wrongpassword", "EMPLOYEE");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(1, employee.getFailedLoginAttempts());
        assertNull(employee.getLockedUntil());
        verify(employeeRepository).save(employee);

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(4, body.get("remainingAttempts"));
        assertEquals(false, body.get("locked"));
    }

    @Test
    void testFifthFailedLogin_LocksAccountFor5Minutes() {
        employee.setFailedLoginAttempts(4);
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest("employee@aseuro.com", "wrongpassword", "EMPLOYEE");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.LOCKED, response.getStatusCode());
        assertEquals(5, employee.getFailedLoginAttempts());
        assertNotNull(employee.getLockedUntil());
        assertTrue(employee.getLockedUntil().isAfter(LocalDateTime.now()));
        verify(employeeRepository).save(employee);

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("locked"));
        assertEquals(300L, body.get("remainingSeconds"));
    }

    @Test
    void testLoginWhileLocked_RejectsImmediately() {
        employee.setFailedLoginAttempts(5);
        employee.setLockedUntil(LocalDateTime.now().plusMinutes(4));
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));

        LoginRequest request = new LoginRequest("employee@aseuro.com", "password", "EMPLOYEE");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.LOCKED, response.getStatusCode());
        verify(authenticationManager, never()).authenticate(any());

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("locked"));
        assertTrue((Long) body.get("remainingSeconds") > 0);
    }
}
