package com.example.desk_ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final JavaMailSender mailSender;
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.enabled:true}")
    private boolean mailEnabled;

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void init() {
        log.info("========================================");
        log.info("OTP Service Initialized");
        log.info("From Email: {}", fromEmail);
        log.info("Mail Enabled: {}", mailEnabled);
        log.info("========================================");
    }

    public String sendOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email, new OtpEntry(otp, LocalDateTime.now().plusMinutes(5)));

        printOtpToConsole(email, otp);

        if (mailEnabled) {
            CompletableFuture.runAsync(() -> {
                try {
                    MimeMessage mimeMessage = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                    helper.setFrom(fromEmail, "DESK AI Security");
                    helper.setTo(email);
                    helper.setSubject("🔐 DESK AI - Your Login Verification Code");

                    String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a"));

                    String htmlContent = "<!DOCTYPE html>"
                            + "<html>"
                            + "<head>"
                            + "<meta charset='UTF-8'>"
                            + "<style>"
                            + "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }"
                            + "  .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.09); border: 1px solid #e2e8f0; }"
                            + "  .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 32px 24px; text-align: center; color: #ffffff; }"
                            + "  .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }"
                            + "  .header p { margin: 8px 0 0; opacity: 0.92; font-size: 14px; font-weight: 500; }"
                            + "  .body { padding: 32px 28px; }"
                            + "  .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }"
                            + "  .instruction { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }"
                            + "  .otp-card { background: linear-gradient(180deg, #f8fafc, #f1f5f9); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08); }"
                            + "  .otp-label { font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }"
                            + "  .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #312e81; font-family: 'Courier New', Courier, monospace; margin: 6px 0; }"
                            + "  .badge-timer { display: inline-block; background: #fef3c7; color: #b45309; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-top: 8px; border: 1px solid #fde68a; }"
                            + "  .info-table { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; }"
                            + "  .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }"
                            + "  .info-row:last-child { margin-bottom: 0; }"
                            + "  .info-lbl { color: #64748b; font-weight: 600; }"
                            + "  .info-val { color: #0f172a; font-weight: 500; }"
                            + "  .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 20px; font-size: 12px; color: #92400e; line-height: 1.5; }"
                            + "  .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }"
                            + "</style>"
                            + "</head>"
                            + "<body>"
                            + "<div class='container'>"
                            + "  <div class='header'>"
                            + "    <h1>⚡ DESK AI</h1>"
                            + "    <p>Identity Verification & Access Control</p>"
                            + "  </div>"
                            + "  <div class='body'>"
                            + "    <div class='greeting'>Hello,</div>"
                            + "    <p class='instruction'>"
                            + "      Use the single-use verification code below to complete your login authentication for DESK AI."
                            + "    </p>"
                            + "    <div class='otp-card'>"
                            + "      <div class='otp-label'>Your Verification Code</div>"
                            + "      <div class='otp-code'>" + otp + "</div>"
                            + "      <div><span class='badge-timer'>⏱️ Valid for 5 minutes</span></div>"
                            + "    </div>"
                            + "    <div class='info-table'>"
                            + "      <div class='info-row'><span class='info-lbl'>Account:</span><span class='info-val'>" + email + "</span></div>"
                            + "      <div class='info-row'><span class='info-lbl'>Requested At:</span><span class='info-val'>" + timeStr + "</span></div>"
                            + "      <div class='info-row'><span class='info-lbl'>Channel:</span><span class='info-val'>Two-Factor Portal Login</span></div>"
                            + "    </div>"
                            + "    <div class='warning-box'>"
                            + "      🔒 <strong>Security Warning:</strong> Never share this code with anyone. DESK AI support personnel will never ask for your verification code."
                            + "    </div>"
                            + "  </div>"
                            + "  <div class='footer'>"
                            + "    <p style='margin: 0;'>This is an automated authentication notice from DESK AI Security Engine.</p>"
                            + "  </div>"
                            + "</div>"
                            + "</body>"
                            + "</html>";

                    helper.setText(htmlContent, true);
                    mailSender.send(mimeMessage);
                    log.info("✅ Rich OTP email sent successfully to: {}", email);
                } catch (Exception e) {
                    log.error("❌ Failed to send rich OTP email to {}: {}", email, e.getMessage());
                    log.warn("OTP is available in console for testing: {}", otp);
                }
            });
        } else {
            log.warn("⚠️ Mail is disabled. OTP available in console only.");
        }

        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email);
        if (entry == null) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }

        boolean valid = entry.otp.equals(otp) && LocalDateTime.now().isBefore(entry.expiresAt);
        if (valid) {
            otpStore.remove(email);
            log.info("✅ OTP verified successfully for: {}", email);
        } else {
            log.warn("❌ Invalid OTP attempt for: {}", email);
        }
        return valid;
    }

    public boolean resendOtp(String email) {
        otpStore.remove(email);
        String newOtp = sendOtp(email);
        return newOtp != null && !newOtp.isEmpty();
    }

    private void printOtpToConsole(String email, String otp) {
        log.info("=========================================");
        log.info("🔐 OTP for {} is: {}", email, otp);
        log.info("=========================================");
        System.out.println("\n╔════════════════════════════════════════════╗");
        System.out.println("║          🔐 OTP VERIFICATION             ║");
        System.out.println("╠════════════════════════════════════════════╣");
        System.out.println("║  Email: " + padRight(email, 30) + " ║");
        System.out.println("║  OTP:   " + padRight(otp, 30) + " ║");
        System.out.println("║  Expires in: 5 minutes                   ║");
        System.out.println("╚════════════════════════════════════════════╝\n");
    }

    private String padRight(String s, int n) {
        if (s == null) return " ".repeat(n);
        if (s.length() > n) return s.substring(0, n);
        return String.format("%-" + n + "s", s);
    }

    private record OtpEntry(String otp, LocalDateTime expiresAt) {}
}