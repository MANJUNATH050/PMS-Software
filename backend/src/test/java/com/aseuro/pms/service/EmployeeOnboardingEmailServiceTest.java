package com.aseuro.pms.service;

import com.aseuro.pms.model.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class EmployeeOnboardingEmailServiceTest {

    private EmployeeOnboardingEmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmployeeOnboardingEmailService();
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "xkeysib-test-key");
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@aseuro.com");
        ReflectionTestUtils.setField(emailService, "senderName", "Aseuro PMS");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    void testSendOnboardingEmail_NullEmployee_ReturnsFalse() {
        boolean result = emailService.sendOnboardingEmail(null, "Password@123");
        assertFalse(result, "Null employee should return false");
    }

    @Test
    void testSendOnboardingEmail_NullEmail_ReturnsFalse() {
        Employee employee = Employee.builder()
                .id(1L)
                .name("Test User")
                .email(null)
                .build();
        boolean result = emailService.sendOnboardingEmail(employee, "Password@123");
        assertFalse(result, "Null email should return false");
    }

    @Test
    void testSendOnboardingEmail_EmptyApiKey_ReturnsFalse() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "");
        Employee employee = Employee.builder()
                .id(1L)
                .name("Test User")
                .email("test@aseuro.com")
                .build();
        boolean result = emailService.sendOnboardingEmail(employee, "Password@123");
        assertFalse(result, "Empty API key should skip sending and return false");
    }

    @Test
    void testSendOnboardingEmail_PlaceholderApiKey_ReturnsFalse() {
        ReflectionTestUtils.setField(emailService, "brevoApiKey", "your_brevo_api_key");
        Employee employee = Employee.builder()
                .id(1L)
                .name("Test User")
                .email("test@aseuro.com")
                .build();
        boolean result = emailService.sendOnboardingEmail(employee, "Password@123");
        assertFalse(result, "Placeholder API key should skip sending and return false");
    }
}
