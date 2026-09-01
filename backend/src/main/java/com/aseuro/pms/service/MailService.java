package com.aseuro.pms.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${mail.from:no-reply@aseuro.com}")
    private String fromAddress;

    @Value("${mail.reset.password.url:https://pmsdemo-frontend1.onrender.com/reset-password}")
    private String resetPasswordUrl;

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String resetLink = String.format("%s?token=%s", resetPasswordUrl, rawToken);

        if (mailSender == null) {
            logger.warn("Mail server is not configured. Password reset link for {}: {}", toEmail, resetLink);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Instructions");
            String content = "<p>You requested a password reset. Click the link below to set a new password. This link will expire in 15 minutes.</p>"
                    + "<p><a href=\"" + resetLink + "\">Reset Password</a></p>"
                    + "<p>If you did not request this, please ignore this email.</p>";
            helper.setText(content, true);
            mailSender.send(message);
            logger.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }
}
