package com.aseuro.pms.controller;

import com.aseuro.pms.dto.ChangePasswordRequest;
import com.aseuro.pms.dto.ForgotPasswordRequest;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.LoginResponse;
import com.aseuro.pms.dto.ResetPasswordRequest;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.PasswordResetToken;
import com.aseuro.pms.model.Role;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.repository.PasswordResetTokenRepository;
import com.aseuro.pms.security.JwtTokenProvider;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.MailService;
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
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
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

    @Mock
    private PasswordResetTokenRepository resetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MailService mailService;

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
                .mustChangePassword(false)
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

        assertTrue(response.getBody() instanceof LoginResponse);
        LoginResponse lr = (LoginResponse) response.getBody();
        assertFalse(lr.getMustChangePassword());
    }

    @Test
    void testLogin_ReturnsMustChangePasswordTrue_ForNewEmployee() {
        employee.setMustChangePassword(true);
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));

        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(1L);
        when(principal.getUsername()).thenReturn("employee@aseuro.com");
        when(principal.getEmployee()).thenReturn(employee);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("mock.jwt.token");

        LoginRequest request = new LoginRequest("employee@aseuro.com", "Temp@12345", "EMPLOYEE");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof LoginResponse);
        LoginResponse lr = (LoginResponse) response.getBody();
        assertTrue(lr.getMustChangePassword());
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

    @Test
    void testForgotPassword_ReturnsGenericMessage() {
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));
        when(resetTokenRepository.findByEmployeeAndUsedAtIsNull(employee)).thenReturn(Collections.emptyList());

        ForgotPasswordRequest request = new ForgotPasswordRequest("employee@aseuro.com");
        ResponseEntity<Map<String, String>> response = authController.forgotPassword(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().get("message").contains("If an account exists"));
        verify(resetTokenRepository).save(any(PasswordResetToken.class));
        verify(mailService).sendPasswordResetEmail(eq("employee@aseuro.com"), anyString());
    }

    @Test
    void testResetPassword_WithDirectEmail_Success() {
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode("NewPass123!")).thenReturn("$2a$10$newHashedPassword");

        ResetPasswordRequest request = new ResetPasswordRequest(null, "NewPass123!", "NewPass123!",
                "employee@aseuro.com");
        ResponseEntity<?> response = authController.resetPassword(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("$2a$10$newHashedPassword", employee.getPassword());
        assertEquals(0, employee.getFailedLoginAttempts());
        assertNull(employee.getLockedUntil());
        verify(employeeRepository).save(employee);
    }

    @Test
    void testResetPassword_MismatchingPasswords_ReturnsBadRequest() {
        ResetPasswordRequest request = new ResetPasswordRequest(null, "NewPass123!", "Different123!",
                "employee@aseuro.com");
        ResponseEntity<?> response = authController.resetPassword(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Passwords do not match.", body.get("message"));
    }

    @Test
    void testLockStatus_WhenLocked_ReturnsRemainingSeconds() {
        employee.setLockedUntil(LocalDateTime.now().plusSeconds(240));
        when(employeeRepository.findByEmail("employee@aseuro.com")).thenReturn(Optional.of(employee));

        ResponseEntity<?> response = authController.getLockStatus("employee@aseuro.com");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("locked"));
        assertTrue((Long) body.get("remainingSeconds") > 0);
    }

    // ========== Change Password Endpoint Tests ==========

    @Test
    void testChangePassword_NotAuthenticated_ReturnsUnauthorized() {
        SecurityContextHolder.clearContext();

        ChangePasswordRequest request = new ChangePasswordRequest("Temp@12345", "NewPass@2026!", "NewPass@2026!");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testChangePassword_WrongCurrentPassword_ReturnsBadRequest() {
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(employee);
        when(auth.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("WrongCurrent", employee.getPassword())).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest("WrongCurrent", "NewPass@2026!", "NewPass@2026!");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Current password is incorrect.", body.get("message"));
    }

    @Test
    void testChangePassword_WeakPassword_ReturnsBadRequest() {
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(employee);
        when(auth.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Temp@12345", employee.getPassword())).thenReturn(true);

        // Weak: no uppercase or special char
        ChangePasswordRequest request = new ChangePasswordRequest("Temp@12345", "weakpassword1", "weakpassword1");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertTrue(((String) body.get("message")).contains("Password must contain at least one uppercase letter"));
    }

    @Test
    void testChangePassword_SameAsCurrentPassword_ReturnsBadRequest() {
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(employee);
        when(auth.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Temp@12345", employee.getPassword())).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest("Temp@12345", "Temp@12345", "Temp@12345");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("New password cannot be the same as the current password.", body.get("message"));
    }

    @Test
    void testChangePassword_MismatchedConfirmPassword_ReturnsBadRequest() {
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(employee);
        when(auth.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Temp@12345", employee.getPassword())).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest("Temp@12345", "NewPass@2026!", "Different@2026!");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("New password and confirm password do not match.", body.get("message"));
    }

    @Test
    void testChangePassword_Success_UpdatesPasswordAndClearsFlag() {
        employee.setMustChangePassword(true);
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(employee);
        when(auth.getPrincipal()).thenReturn(principal);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Temp@12345", employee.getPassword())).thenReturn(true);
        when(passwordEncoder.matches("NewPass@2026!", employee.getPassword())).thenReturn(false);
        when(passwordEncoder.encode("NewPass@2026!")).thenReturn("$2a$10$newEncodedPass");

        ChangePasswordRequest request = new ChangePasswordRequest("Temp@12345", "NewPass@2026!", "NewPass@2026!");
        ResponseEntity<?> response = authController.changePassword(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("$2a$10$newEncodedPass", employee.getPassword());
        assertFalse(employee.getMustChangePassword());
        assertEquals(0, employee.getFailedLoginAttempts());
        assertNull(employee.getLockedUntil());
        verify(employeeRepository).save(employee);

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("Password changed successfully.", body.get("message"));
        assertEquals(false, body.get("mustChangePassword"));
    }
}
