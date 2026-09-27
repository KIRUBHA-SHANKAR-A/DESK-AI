package com.example.desk_ai.service;

import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.entity.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.enabled:true}")
    private boolean mailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Asynchronously sends a rich HTML email notification when a ticket is solved/resolved.
     */
    public void sendTicketResolvedEmail(Ticket ticket, User resolvedBy, String resolution) {
        if (ticket == null || ticket.getCreatedBy() == null || ticket.getCreatedBy().getEmail() == null) {
            log.warn("Cannot send ticket resolved email: Missing ticket or recipient email.");
            return;
        }

        String recipientEmail = ticket.getCreatedBy().getEmail();
        String recipientName = ticket.getCreatedBy().getName() != null ? ticket.getCreatedBy().getName() : "User";
        String ticketNumber = ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ("TKT-" + ticket.getTicketId());
        String ticketTitle = ticket.getTitle() != null ? ticket.getTitle() : "Support Request";
        String category = ticket.getCategory() != null ? ticket.getCategory().getCategoryName() : "General";
        String priority = ticket.getPriority() != null ? ticket.getPriority() : "MEDIUM";
        String engineerName = resolvedBy != null && resolvedBy.getName() != null ? resolvedBy.getName() : "Support Engineer";
        String engineerEmail = resolvedBy != null && resolvedBy.getEmail() != null ? resolvedBy.getEmail() : "";
        String cleanResolution = resolution != null && !resolution.isBlank() ? resolution : (ticket.getResolution() != null ? ticket.getResolution() : "Issue has been resolved successfully.");
        String solvedAtStr = ticket.getSolvedAt() != null 
                ? ticket.getSolvedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a")) 
                : java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a"));

        CompletableFuture.runAsync(() -> {
            try {
                if (!mailEnabled) {
                    log.info("[EMAIL SIMULATION] Ticket Solved Email -> To: {}, Ticket: #{}", recipientEmail, ticketNumber);
                    return;
                }

                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                helper.setFrom(fromEmail, "DESK AI Helpdesk");
                helper.setTo(recipientEmail);
                helper.setSubject("✅ Resolved Ticket #" + ticketNumber + ": " + ticketTitle);

                String htmlContent = "<!DOCTYPE html>"
                        + "<html>"
                        + "<head>"
                        + "<meta charset='UTF-8'>"
                        + "<style>"
                        + "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }"
                        + "  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }"
                        + "  .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px 24px; text-align: center; color: #ffffff; }"
                        + "  .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }"
                        + "  .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }"
                        + "  .body { padding: 28px 24px; }"
                        + "  .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }"
                        + "  .ticket-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 18px 0; }"
                        + "  .ticket-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }"
                        + "  .label { font-weight: 600; color: #64748b; width: 130px; }"
                        + "  .val { color: #0f172a; flex: 1; }"
                        + "  .resolution-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 20px 0; }"
                        + "  .resolution-title { font-weight: 700; color: #065f46; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }"
                        + "  .resolution-text { color: #047857; font-size: 14px; white-space: pre-wrap; line-height: 1.5; margin: 0; }"
                        + "  .status-badge { display: inline-block; background: #10b981; color: white; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }"
                        + "  .action-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; margin-top: 16px; }"
                        + "  .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }"
                        + "</style>"
                        + "</head>"
                        + "<body>"
                        + "<div class='container'>"
                        + "  <div class='header'>"
                        + "    <h1>DESK AI Support</h1>"
                        + "    <p>Your Ticket Resolution Notice</p>"
                        + "  </div>"
                        + "  <div class='body'>"
                        + "    <div class='greeting'>Hello " + recipientName + ",</div>"
                        + "    <p style='font-size: 14px; line-height: 1.6; color: #334155;'>"
                        + "      Great news! Your ticket has been marked as <span class='status-badge'>SOLVED</span> by our support team."
                        + "    </p>"
                        + "    <div class='ticket-card'>"
                        + "      <div class='ticket-row'><span class='label'>Ticket Number:</span><span class='val'><strong>#" + ticketNumber + "</strong></span></div>"
                        + "      <div class='ticket-row'><span class='label'>Subject:</span><span class='val'>" + ticketTitle + "</span></div>"
                        + "      <div class='ticket-row'><span class='label'>Category:</span><span class='val'>" + category + "</span></div>"
                        + "      <div class='ticket-row'><span class='label'>Priority:</span><span class='val'>" + priority + "</span></div>"
                        + "      <div class='ticket-row'><span class='label'>Solved By:</span><span class='val'>" + engineerName + (engineerEmail.isEmpty() ? "" : " (" + engineerEmail + ")") + "</span></div>"
                        + "      <div class='ticket-row'><span class='label'>Solved At:</span><span class='val'>" + solvedAtStr + "</span></div>"
                        + "    </div>"
                        + "    <div class='resolution-box'>"
                        + "      <div class='resolution-title'>💡 Resolution Summary:</div>"
                        + "      <p class='resolution-text'>" + cleanResolution + "</p>"
                        + "    </div>"
                        + "    <p style='font-size: 13px; color: #64748b; line-height: 1.5;'>"
                        + "      Please log in to your DESK AI portal to review the solution and verify ticket closure. If you still experience issues, you can reopen or reply to the ticket directly in the portal."
                        + "    </p>"
                        + "    <div style='text-align: center; margin: 24px 0 10px;'>"
                        + "      <a href='http://localhost:5173/employee' class='action-btn' target='_blank'>Open DESK AI Portal</a>"
                        + "    </div>"
                        + "  </div>"
                        + "  <div class='footer'>"
                        + "    <p style='margin: 0;'>This is an automated notification from DESK AI Intelligent Helpdesk Platform.</p>"
                        + "  </div>"
                        + "</div>"
                        + "</body>"
                        + "</html>";

                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                log.info("✅ Ticket resolved email successfully sent to: {} for ticket #{}", recipientEmail, ticketNumber);
            } catch (Exception e) {
                log.error("❌ Failed to send ticket resolved email to {}: {}", recipientEmail, e.getMessage(), e);
            }
        });
    }
}
