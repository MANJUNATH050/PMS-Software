package com.aseuro.pms.service;

import com.aseuro.pms.model.Employee;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertTrue;

class EmployeeOnboardingEmailServiceLiveTest {

    @Test
    @Disabled("Manual live integration test only")
    void testLiveBrevoSend() {
        EmployeeOnboardingEmailService service = new EmployeeOnboardingEmailService();
        ReflectionTestUtils.setField(service, "brevoApiKey", "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");
        ReflectionTestUtils.setField(service, "senderEmail", "demomanjunath@gmail.com");
        ReflectionTestUtils.setField(service, "senderName", "Aseuro PMS");
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");

        Employee employee = Employee.builder()
                .id(101L)
                .name("Manjunath Demo")
                .email("demomanjunath@gmail.com")
                .build();

        boolean sent = service.sendOnboardingEmail(employee, "Password@123");
        System.out.println("LIVE TEST RESULT: " + sent);
        assertTrue(sent, "Live email sending via Brevo should succeed with verified sender");
    }
}
