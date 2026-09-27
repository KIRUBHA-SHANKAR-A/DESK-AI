package com.example.desk_ai.service;

import com.example.desk_ai.entity.Notification;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.entity.User;
import com.example.desk_ai.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    public List<Notification> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> findByUserId(Long userId) {
        return repo.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Notification> findById(Long id) {
        return repo.findById(id);
    }

    public Notification save(Notification n) {
        return repo.save(n);
    }

    public void deleteById(Long id) {
        repo.deleteById(id);
    }

    public Notification notifyUser(User user, String title, String message) {
        if (user == null) return null;
        try {
            Notification n = new Notification();
            n.setUser(user);
            n.setTitle(title);
            n.setMessage(message);
            n.setIsRead(false);
            n.setCreatedAt(LocalDateTime.now());
            return repo.save(n);
        } catch (Exception e) {
            logger.warn("Failed to save notification: {}", e.getMessage());
            return null;
        }
    }

    // 1. Ticket Assignment Alert
    public void notifyTicketAssignment(Ticket ticket, User engineer) {
        if (ticket == null || engineer == null) return;
        String title = "Ticket Assigned: " + (ticket.getTicketNumber() != null ? ticket.getTicketNumber() : "#" + ticket.getTicketId());
        String msg = String.format("You have been assigned to ticket '%s' (Priority: %s).",
                ticket.getTitle(), ticket.getPriority() != null ? ticket.getPriority() : "MEDIUM");
        notifyUser(engineer, title, msg);
    }

    // 2. Status Change Alert
    public void notifyStatusChange(Ticket ticket, String oldStatus, String newStatus) {
        if (ticket == null || ticket.getCreatedBy() == null) return;
        String title = "Status Updated: " + (ticket.getTicketNumber() != null ? ticket.getTicketNumber() : "#" + ticket.getTicketId());
        String msg = String.format("Ticket '%s' status changed from %s to %s.",
                ticket.getTitle(), oldStatus != null ? oldStatus : "UNKNOWN", newStatus);
        notifyUser(ticket.getCreatedBy(), title, msg);
    }

    // 3. SLA Breach Alert
    public void notifySlaBreach(Ticket ticket, String riskLevel, String reason) {
        if (ticket == null) return;
        String title = "SLA Alert [" + riskLevel + "]: " + (ticket.getTicketNumber() != null ? ticket.getTicketNumber() : "#" + ticket.getTicketId());
        String msg = String.format("Ticket '%s' (Priority: %s) has elevated SLA breach risk. %s",
                ticket.getTitle(), ticket.getPriority(), reason != null ? reason : "Please review resolution deadline.");

        if (ticket.getAssignedTo() != null) {
            notifyUser(ticket.getAssignedTo(), title, msg);
        }
    }

    // 4. Comment Alert
    public void notifyNewComment(Ticket ticket, User commenter, String commentSnippet, boolean isInternal) {
        if (ticket == null) return;
        String tktNum = ticket.getTicketNumber() != null ? ticket.getTicketNumber() : "#" + ticket.getTicketId();

        // If it's an internal note, only notify assigned engineer / support staff (not the employee creator)
        if (isInternal) {
            if (ticket.getAssignedTo() != null && (commenter == null || !ticket.getAssignedTo().getUserId().equals(commenter.getUserId()))) {
                notifyUser(ticket.getAssignedTo(), "New Internal Note: " + tktNum,
                        "Internal note added on '" + ticket.getTitle() + "': " + commentSnippet);
            }
            return;
        }

        // Public comment: If commenter is creator, notify assigned engineer
        if (commenter != null && ticket.getCreatedBy() != null && commenter.getUserId().equals(ticket.getCreatedBy().getUserId())) {
            if (ticket.getAssignedTo() != null) {
                notifyUser(ticket.getAssignedTo(), "New User Comment: " + tktNum,
                        commenter.getName() + " commented: " + commentSnippet);
            }
        } else {
            // Commenter is engineer/admin, notify ticket creator
            if (ticket.getCreatedBy() != null) {
                notifyUser(ticket.getCreatedBy(), "Support Reply: " + tktNum,
                        "New reply on your ticket: " + commentSnippet);
            }
        }
    }
}
