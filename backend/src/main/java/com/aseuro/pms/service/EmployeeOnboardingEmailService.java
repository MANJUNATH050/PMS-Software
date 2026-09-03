package com.aseuro.pms.service;

import com.aseuro.pms.model.Employee;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;

@Service
public class EmployeeOnboardingEmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeOnboardingEmailService.class);

    @Value("${brevo.api-key:${BREVO_API_KEY}}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:demomanjunath@gmail.com}")
    private String senderEmail;

    @Value("${brevo.sender-name:Aseuro PMS}")
    private String senderName;

    @Value("${app.frontend-url:${PMS_FRONTEND_URL:http://localhost:5173}}")
    private String frontendUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public boolean sendOnboardingEmail(Employee employee, String temporaryPassword) {
        if (employee == null || employee.getEmail() == null || employee.getEmail().trim().isEmpty()) {
            logger.warn("Cannot send onboarding email: Employee or email is null/empty.");
            return false;
        }

        String toEmail = employee.getEmail().trim().toLowerCase();
        String maskedEmail = maskEmail(toEmail);

        if (brevoApiKey == null || brevoApiKey.trim().isEmpty() || brevoApiKey.contains("your_brevo_api_key")) {
            logger.warn("Brevo email service is not configured. Onboarding email skipped for {}", maskedEmail);
            return false;
        }

        String empName = employee.getName() != null && !employee.getName().trim().isEmpty() ? employee.getName().trim()
                : "Employee";
        String empCode = "EMP-" + employee.getId();
        String loginUrl = (frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173")
                + "/login";

        String htmlContent = buildHtmlContent(empName, empCode, toEmail, temporaryPassword, loginUrl);

        String jsonPayload = String.format(
                "{" +
                        "\"sender\":{\"name\":\"%s\",\"email\":\"%s\"}," +
                        "\"to\":[{\"email\":\"%s\",\"name\":\"%s\"}]," +
                        "\"subject\":\"Welcome to Aseuro PMS – Your Performance Management Account\"," +
                        "\"htmlContent\":\"%s\"" +
                        "}",
                escapeJson(senderName),
                escapeJson(senderEmail),
                escapeJson(toEmail),
                escapeJson(empName),
                escapeJson(htmlContent));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Employee onboarding email sent successfully to {}", maskedEmail);
                return true;
            } else {
                logger.error("Failed to send employee onboarding email to {}. Brevo HTTP status {}: {}",
                        maskedEmail, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            logger.error("Failed to send employee onboarding email to {}: {}", maskedEmail, e.getMessage());
            return false;
        }
    }

    private String buildHtmlContent(String name, String empCode, String email, String password, String loginUrl) {
        int currentYear = LocalDate.now().getYear();
        String safePassword = password != null ? password : "";
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #3A3A3A;'>"
                +
                "  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>"
                +
                "    <div style='background: linear-gradient(135deg, #4A7637 0%, #6FC04A 100%); padding: 30px 20px; text-align: center; color: #ffffff;'>"
                +
                "      <h1 style='margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;'>ASEURO</h1>" +
                "      <p style='margin: 5px 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;'>Performance Management System</p>"
                +
                "    </div>" +
                "    <div style='padding: 30px 25px;'>" +
                "      <h2 style='color: #4A7637; font-size: 20px; margin-top: 0;'>Welcome to Aseuro PMS</h2>" +
                "      <p style='font-size: 14px; line-height: 1.6; color: #4b5563;'>Hello <strong>" + escapeHtml(name)
                + "</strong>,</p>" +
                "      <p style='font-size: 14px; line-height: 1.6; color: #4b5563;'>Welcome to Aseuro! Your Performance Management System (PMS) account has been successfully created. You can now access the PMS portal to view your profile, KPIs, performance objectives, appraisal information, and other performance-related activities.</p>"
                +
                "      " +
                "      <div style='background-color: #f8faf9; border: 1px solid #e2e8f0; border-left: 4px solid #6FC04A; border-radius: 8px; padding: 20px; margin: 25px 0;'>"
                +
                "        <h3 style='margin-top: 0; font-size: 14px; color: #3A3A3A; text-transform: uppercase; letter-spacing: 0.5px;'>Your Account Login Details</h3>"
                +
                "        <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
                "          <tr><td style='padding: 6px 0; color: #64748b; width: 140px;'><strong>Employee Name:</strong></td><td style='padding: 6px 0; color: #1e293b; font-weight: 600;'>"
                + escapeHtml(name) + "</td></tr>" +
                "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Employee ID:</strong></td><td style='padding: 6px 0; color: #4A7637; font-weight: 700;'>"
                + escapeHtml(empCode) + "</td></tr>" +
                "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Login Email:</strong></td><td style='padding: 6px 0; color: #1e293b; font-weight: 600;'>"
                + escapeHtml(email) + "</td></tr>" +
                "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Initial Password:</strong></td><td style='padding: 6px 0; color: #1e293b; font-family: monospace; font-size: 15px; font-weight: 700; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;'>"
                + escapeHtml(safePassword) + "</td></tr>" +
                "        </table>" +
                "      </div>" +
                "      " +
                "      <div style='text-align: center; margin: 30px 0;'>" +
                "        <a href='" + loginUrl
                + "' style='background-color: #6FC04A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(111, 192, 74, 0.25);'>LOGIN TO ASEURO PMS</a>"
                +
                "      </div>" +
                "      " +
                "      <div style='background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 15px; font-size: 13px; color: #9a3412; margin-bottom: 25px;'>"
                +
                "        <strong style='display: block; margin-bottom: 4px;'>Security Guidelines:</strong>" +
                "        • For your security, please change your password after your first login.<br/>" +
                "        • Never share your password with anyone.<br/>" +
                "        • If you did not expect this account, please contact your HR administrator immediately." +
                "      </div>" +
                "      " +
                "      <p style='font-size: 14px; color: #4b5563; margin-bottom: 5px;'>We are pleased to have you as part of the Aseuro team.</p>"
                +
                "      <p style='font-size: 14px; font-weight: bold; color: #3A3A3A; margin-top: 0;'>Regards,<br/><span style='color: #4A7637;'>HR Administration</span><br/>Aseuro Technologies</p>"
                +
                "    </div>" +
                "    <div style='background: #3A3A3A; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #4b5563;'>"
                +
                "      <p style='margin: 0;'>&copy; " + currentYear
                + " Aseuro Technologies. Performance Management System. All rights reserved.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@"))
            return "***";
        String[] parts = email.split("@");
        String name = parts[0];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + parts[1];
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + parts[1];
    }

    private String escapeHtml(String text) {
        if (text == null)
            return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeJson(String text) {
        if (text == null)
            return "";
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
