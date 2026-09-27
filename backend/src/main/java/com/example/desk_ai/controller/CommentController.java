package com.example.desk_ai.controller;

import com.example.desk_ai.entity.Comment;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.entity.User;
import com.example.desk_ai.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService service;
    private final TicketService ticketService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public CommentController(CommentService service,
                             TicketService ticketService,
                             UserService userService,
                             NotificationService notificationService,
                             AuditLogService auditLogService) {
        this.service = service;
        this.ticketService = ticketService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Comment> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> get(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // ── Module 5: Internal vs External Comment Filtering ────────────────────────
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Comment>> getByTicket(@PathVariable Long ticketId, Authentication auth) {
        List<Comment> allComments = service.findByTicketId(ticketId);

        boolean isStaff = false;
        if (auth != null && auth.getName() != null) {
            try {
                User user = (User) userService.loadUserByUsername(auth.getName());
                if (user != null && user.getRole() != null) {
                    String role = user.getRole().getRoleName().toUpperCase();
                    if ("ADMIN".equals(role) || "SUPPORT_ENGINEER".equals(role) || "ENGINEER".equals(role)) {
                        isStaff = true;
                    }
                }
            } catch (Exception ignored) {}
        }

        if (isStaff) {
            return ResponseEntity.ok(allComments);
        } else {
            // Filter out internal comments for regular employees
            List<Comment> externalOnly = allComments.stream()
                    .filter(c -> !Boolean.TRUE.equals(c.getInternalComment()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(externalOnly);
        }
    }

    @PostMapping("/ticket/{ticketId}")
    public ResponseEntity<?> addCommentToTicket(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            Ticket ticket = ticketService.findById(ticketId)
                    .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

            User user = null;
            if (auth != null && auth.getName() != null) {
                user = (User) userService.loadUserByUsername(auth.getName());
            }

            String text = (String) body.get("commentText");
            if (text == null || text.isBlank()) {
                text = (String) body.get("message");
            }
            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment message is required"));
            }

            Comment comment = new Comment();
            comment.setMessage(text);
            comment.setTicket(ticket);
            comment.setUser(user);
            comment.setCreatedAt(LocalDateTime.now());
            boolean isInternal = false;
            if (body.get("internalComment") instanceof Boolean) {
                isInternal = (Boolean) body.get("internalComment");
                comment.setInternalComment(isInternal);
            }
            if (body.get("attachmentBase64") != null) {
                comment.setAttachmentBase64((String) body.get("attachmentBase64"));
                comment.setAttachmentName((String) body.getOrDefault("attachmentName", "attachment.png"));
                comment.setAttachmentType((String) body.getOrDefault("attachmentType", "image/png"));
            }

            Comment saved = service.save(comment);

            // Update ticket timestamp
            ticket.setUpdatedAt(LocalDateTime.now());
            ticketService.save(ticket);

            // ── Module 8: Comment Alert Notification ────────────────────────────
            try {
                notificationService.notifyNewComment(ticket, user, text.length() > 60 ? text.substring(0, 57) + "..." : text, isInternal);
            } catch (Exception ignored) {}

            // Audit log
            try {
                String userName = user != null ? user.getName() : "Anonymous";
                String userRole = user != null && user.getRole() != null ? user.getRole().getRoleName() : "USER";
                auditLogService.log("COMMENT_ADDED", "TICKET", ticketId.toString(), userName, userRole,
                        (isInternal ? "[INTERNAL] " : "[PUBLIC] ") + (text.length() > 80 ? text.substring(0, 77) + "..." : text));
            } catch (Exception ignored) {}

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public Comment create(@RequestBody Comment c) {
        return service.save(c);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> update(@PathVariable Long id, @RequestBody Comment c) {
        c.setCommentId(id);
        return ResponseEntity.ok(service.save(c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
