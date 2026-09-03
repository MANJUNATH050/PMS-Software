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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping({"/auth", "/api/auth"})
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 5;
    private static final int RESET_TOKEN_EXPIRY_MINUTES = 15;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          EmployeeRepository employeeRepository,
                          PasswordResetTokenRepository resetTokenRepository,
                          PasswordEncoder passwordEncoder,
                          MailService mailService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.employeeRepository = employeeRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    // ========== LOGIN ==========

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email address is required."));
        }

        String email = loginRequest.getEmail().trim();
        Optional<Employee> empOpt = employeeRepository.findByEmail(email);

        if (empOpt.isEmpty()) {
            // Do not reveal whether the email exists
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        Employee emp = empOpt.get();

        // 1. Check Server-Side Account Lock Status
        if (emp.getLockedUntil() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(emp.getLockedUntil())) {
                long remainingSecs = java.time.Duration.between(now, emp.getLockedUntil()).getSeconds();
                if (remainingSecs < 0) remainingSecs = 0;

                Map<String, Object> lockResponse = new HashMap<>();
                lockResponse.put("message", "Too many failed login attempts. Your account has been temporarily locked for 5 minutes.");
                lockResponse.put("locked", true);
                lockResponse.put("lockedUntil", emp.getLockedUntil().toString());
                lockResponse.put("remainingSeconds", remainingSecs);
                return ResponseEntity.status(HttpStatus.LOCKED).body(lockResponse);
            } else {
                // Lock has expired - automatically reset
                emp.setFailedLoginAttempts(0);
                emp.setLockedUntil(null);
                employeeRepository.save(emp);
            }
        }

        // 2. Validate Role if explicitly requested
        String requestedRole = loginRequest.getRole();
        if (requestedRole != null && !requestedRole.trim().isEmpty()) {
            String roleUpper = requestedRole.trim().toUpperCase();
            if (roleUpper.equals("HR") || roleUpper.equals("ROLE_HR")) {
                if (emp.getRole() != Role.ROLE_HR) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid HR email ID."));
                }
            } else if (roleUpper.equals("MANAGER") || roleUpper.equals("ROLE_MANAGER")) {
                if (emp.getRole() != Role.ROLE_MANAGER) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid email ID."));
                }
            } else if (roleUpper.equals("EMPLOYEE") || roleUpper.equals("ROLE_EMPLOYEE")) {
                if (emp.getRole() != Role.ROLE_EMPLOYEE) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid Employee email ID."));
                }
            }
        }

        // 3. Validate Account Active Status
        if (emp.getAccountStatus() != null && !"ACTIVE".equalsIgnoreCase(emp.getAccountStatus())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Account is inactive. Please contact HR."));
        }

        // 4. Authenticate Credentials
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Reset failed login attempts on successful login
            if ((emp.getFailedLoginAttempts() != null && emp.getFailedLoginAttempts() > 0) || emp.getLockedUntil() != null) {
                emp.setFailedLoginAttempts(0);
                emp.setLockedUntil(null);
                employeeRepository.save(emp);
            }

            return ResponseEntity.ok(LoginResponse.builder()
                    .token(jwt)
                    .tokenType("Bearer")
                    .id(userPrincipal.getId())
                    .email(userPrincipal.getUsername())
                    .name(userPrincipal.getEmployee().getName())
                    .role(userPrincipal.getEmployee().getRole().name())
                    .mustChangePassword(Boolean.TRUE.equals(emp.getMustChangePassword()))
                    .build());
        } catch (Exception e) {
            // Track consecutive failed login attempts
            int currentAttempts = (emp.getFailedLoginAttempts() != null ? emp.getFailedLoginAttempts() : 0) + 1;
            emp.setFailedLoginAttempts(currentAttempts);

            if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
                LocalDateTime lockExpiry = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
                emp.setLockedUntil(lockExpiry);
                employeeRepository.save(emp);

                Map<String, Object> lockResponse = new HashMap<>();
                lockResponse.put("message", "Too many failed login attempts. Your account has been temporarily locked for 5 minutes.");
                lockResponse.put("locked", true);
                lockResponse.put("lockedUntil", lockExpiry.toString());
                lockResponse.put("remainingSeconds", (long) LOCK_DURATION_MINUTES * 60);
                return ResponseEntity.status(HttpStatus.LOCKED).body(lockResponse);
            } else {
                employeeRepository.save(emp);
                int remainingAttempts = MAX_FAILED_ATTEMPTS - currentAttempts;

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "Invalid email or password.");
                errorResponse.put("failedAttempts", currentAttempts);
                errorResponse.put("remainingAttempts", remainingAttempts);
                errorResponse.put("locked", false);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
        }
    }

    // ========== LOCK STATUS ==========

    @GetMapping("/lock-status")
    public ResponseEntity<?> getLockStatus(@RequestParam String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("locked", false, "remainingSeconds", 0));
        }

        Optional<Employee> empOpt = employeeRepository.findByEmail(email.trim());
        if (empOpt.isEmpty() || empOpt.get().getLockedUntil() == null) {
            return ResponseEntity.ok(Map.of("locked", false, "remainingSeconds", 0));
        }

        Employee emp = empOpt.get();
        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(emp.getLockedUntil())) {
            long remainingSecs = java.time.Duration.between(now, emp.getLockedUntil()).getSeconds();
            return ResponseEntity.ok(Map.of(
                    "locked", true,
                    "lockedUntil", emp.getLockedUntil().toString(),
                    "remainingSeconds", Math.max(0, remainingSecs),
                    "message", "Account temporarily locked."
            ));
        } else {
            emp.setFailedLoginAttempts(0);
            emp.setLockedUntil(null);
            employeeRepository.save(emp);
            return ResponseEntity.ok(Map.of("locked", false, "remainingSeconds", 0));
        }
    }

    // ========== FORGOT PASSWORD ==========

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account exists for this email address, password reset instructions have been sent.");

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.ok(response);
        }

        String email = request.getEmail().trim();
        Optional<Employee> empOpt = employeeRepository.findByEmail(email);

        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();

            // Invalidate any existing unused reset tokens for this user
            List<PasswordResetToken> existingTokens = resetTokenRepository.findByEmployeeAndUsedAtIsNull(emp);
            for (PasswordResetToken t : existingTokens) {
                t.setUsedAt(LocalDateTime.now());
            }
            if (!existingTokens.isEmpty()) {
                resetTokenRepository.saveAll(existingTokens);
            }

            // Generate cryptographically secure token
            String rawToken = generateSecureToken();
            String tokenHash = sha256(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .employee(emp)
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES))
                    .createdAt(LocalDateTime.now())
                    .build();
            resetTokenRepository.save(resetToken);

            // Send email (or log link if mail not configured)
            mailService.sendPasswordResetEmail(email, rawToken);
        }

        // Always return the same generic response
        return ResponseEntity.ok(response);
    }

    // ========== RESET PASSWORD ==========

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String token = request.getToken() != null ? request.getToken().trim() : null;
        String email = request.getEmail() != null ? request.getEmail().trim() : null;

        if ((token == null || token.isEmpty()) && (email == null || email.isEmpty())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Reset token or email address is required."));
        }

        // Validate password length >= 8
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password must be at least 8 characters."));
        }

        // Validate confirmPassword matches
        if (request.getConfirmPassword() == null || !request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Passwords do not match."));
        }

        Employee emp = null;

        if (token != null && !token.isEmpty()) {
            String tokenHash = sha256(token);
            Optional<PasswordResetToken> tokenOpt = resetTokenRepository.findByTokenHash(tokenHash);

            if (tokenOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid password reset link."));
            }

            PasswordResetToken resetToken = tokenOpt.get();

            if (resetToken.getUsedAt() != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "This password reset link has already been used."));
            }

            if (LocalDateTime.now().isAfter(resetToken.getExpiresAt())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "This password reset link has expired. Please request a new one."));
            }

            emp = resetToken.getEmployee();
            resetToken.setUsedAt(LocalDateTime.now());
            resetTokenRepository.save(resetToken);
        } else if (email != null && !email.isEmpty()) {
            Optional<Employee> empOpt = employeeRepository.findByEmail(email);
            if (empOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email address not found."));
            }
            emp = empOpt.get();
        }

        if (emp == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "User account not found."));
        }

        // BCrypt hash the new password and update
        emp.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Reset lockout state
        emp.setFailedLoginAttempts(0);
        emp.setLockedUntil(null);
        employeeRepository.save(emp);

        // Invalidate all other unused tokens for this user
        List<PasswordResetToken> otherTokens = resetTokenRepository.findByEmployeeAndUsedAtIsNull(emp);
        for (PasswordResetToken t : otherTokens) {
            t.setUsedAt(LocalDateTime.now());
        }
        if (!otherTokens.isEmpty()) {
            resetTokenRepository.saveAll(otherTokens);
        }

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in with your new password."));
    }

    // ========== CHANGE PASSWORD (AUTHENTICATED) ==========

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        return changePassword(request, null);
    }

    public ResponseEntity<?> changePassword(
            ChangePasswordRequest request,
            UserPrincipal userPrincipal) {
        
        UserPrincipal principal = userPrincipal;
        if (principal == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
                principal = (UserPrincipal) auth.getPrincipal();
            }
        }

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User is not authenticated."));
        }

        Optional<Employee> empOpt = Optional.empty();
        if (principal.getId() != null) {
            empOpt = employeeRepository.findById(principal.getId());
        }
        if (empOpt.isEmpty() && principal.getUsername() != null) {
            empOpt = employeeRepository.findByEmail(principal.getUsername().trim());
        }

        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Employee account not found."));
        }

        Employee emp = empOpt.get();

        // 1. Verify Current Password
        String currentPass = request.getCurrentPassword();
        if (currentPass == null || currentPass.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Current password is required."));
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), emp.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Current password is incorrect."));
        }

        // 2. Validate New Password
        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password is required."));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password must be at least 8 characters long."));
        }

        // Security requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : newPassword.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."));
        }

        // 3. Reject if new password same as current password
        if (passwordEncoder.matches(newPassword, emp.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password cannot be the same as the current password."));
        }

        // 4. Validate Confirm Password if provided
        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isEmpty()) {
            if (!newPassword.equals(request.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "New password and confirm password do not match."));
            }
        }

        // 5. Update Password & clear mustChangePassword
        emp.setPassword(passwordEncoder.encode(newPassword));
        emp.setMustChangePassword(false);
        emp.setFailedLoginAttempts(0);
        emp.setLockedUntil(null);
        employeeRepository.save(emp);

        return ResponseEntity.ok(Map.of(
                "message", "Password changed successfully.",
                "mustChangePassword", false
        ));
    }

    // ========== HELPER METHODS ==========

    private String generateSecureToken() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
