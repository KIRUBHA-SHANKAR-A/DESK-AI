package com.example.desk_ai.controller;

import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.entity.User;
import com.example.desk_ai.service.TicketService;
import com.example.desk_ai.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;
    private final com.example.desk_ai.service.AIService aiService;
    private final com.example.desk_ai.service.KnowledgeBaseService kbService;

    public TicketController(TicketService ticketService,
                            UserService userService,
                            com.example.desk_ai.service.AIService aiService,
                            com.example.desk_ai.service.KnowledgeBaseService kbService) {
        this.ticketService = ticketService;
        this.userService = userService;
        this.aiService = aiService;
        this.kbService = kbService;
    }

    // ── Get tickets (Admin sees all, Support Engineer sees department/assigned tickets) ──
    @GetMapping
    public ResponseEntity<?> all(Authentication auth) {
        try {
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.ok(ticketService.findAll());
            }
            User user = (User) userService.loadUserByUsername(auth.getName());
            if (user == null) {
                return ResponseEntity.ok(ticketService.findAll());
            }

            String roleName = user.getRole() != null ? user.getRole().getRoleName().toUpperCase() : "";
            if ("SUPPORT_ENGINEER".equals(roleName) || "ENGINEER".equals(roleName)) {
                return ResponseEntity.ok(ticketService.findForSupportEngineer(user));
            }

            return ResponseEntity.ok(ticketService.findAll());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get logged-in user's own tickets ─────────────────────────────────────
    @GetMapping({"/my", "/my-tickets"})
    public ResponseEntity<?> myTickets(Authentication auth) {
        try {
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            User user = (User) userService.loadUserByUsername(auth.getName());
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            List<Ticket> tickets = ticketService.findByUserId(user.getUserId());
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    // ── Stats for logged-in employee ─────────────────────────────────────────
    @GetMapping("/my/stats")
    public ResponseEntity<?> myStats(Authentication auth) {
        try {
            User user = (User) userService.loadUserByUsername(auth.getName());
            List<Ticket> tickets = ticketService.findByUserId(user.getUserId());
            long open = tickets.stream().filter(t -> "OPEN".equalsIgnoreCase(t.getStatus())).count();
            long inProgress = tickets.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
            long resolved = tickets.stream().filter(t -> "RESOLVED".equalsIgnoreCase(t.getStatus())).count();
            long closed = tickets.stream().filter(t -> "CLOSED".equalsIgnoreCase(t.getStatus())).count();
            return ResponseEntity.ok(Map.of(
                "total", tickets.size(),
                "open", open,
                "inProgress", inProgress,
                "resolved", resolved,
                "closed", closed
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> get(@PathVariable Long id) {
        return ticketService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Create ticket — auto-link to logged-in user & trigger AI classification + routing ──────
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Ticket ticket, Authentication auth) {
        try {
            User user = (User) userService.loadUserByUsername(auth.getName());
            Ticket saved = ticketService.createTicketWithAI(ticket, user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error creating ticket"));
        }
    }

    // ── AI Endpoints ──────────────────────────────────────────────────────────
    @PostMapping("/ai/classify")
    public ResponseEntity<Map<String, Object>> classify(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(aiService.classifyTicket(request.get("title"), request.get("description")));
    }

    @PostMapping("/ai/duplicate-check")
    public ResponseEntity<List<Map<String, Object>>> checkDuplicates(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(aiService.checkDuplicates(request.get("title"), request.get("description")));
    }

    @PostMapping("/ai/recommend-kb")
    public ResponseEntity<List<Map<String, Object>>> recommendKB(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String description = request.get("description");
        List<Map<String, Object>> recs = aiService.recommendKB(title, description);
        if (recs == null || recs.isEmpty()) {
            recs = kbService.searchMatchingArticles(title, description);
        }
        return ResponseEntity.ok(recs);
    }

    @PostMapping("/ai/predict-priority")
    public ResponseEntity<Map<String, Object>> predictPriority(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(aiService.predictPriority(request.get("title"), request.get("description")));
    }

    // ── Ticket Lifecycle Workflow Endpoints ────────────────────────────────────

    /**
     * Step 2: Engineer picks / claims an OPEN ticket (OPEN -> ASSIGNED)
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignTicket(@PathVariable Long id, Authentication auth) {
        try {
            User engineer = (User) userService.loadUserByUsername(auth.getName());
            Ticket assigned = ticketService.assignTicketToEngineer(id, engineer);
            return ResponseEntity.ok(assigned);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to assign ticket: " + e.getMessage()));
        }
    }

    /**
     * Step 3: Assigned engineer starts active progress (ASSIGNED -> IN_PROGRESS)
     */
    @PutMapping("/{id}/start")
    public ResponseEntity<?> startProgress(@PathVariable Long id, Authentication auth) {
        try {
            User engineer = (User) userService.loadUserByUsername(auth.getName());
            Ticket updated = ticketService.startTicketProgress(id, engineer);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to start ticket: " + e.getMessage()));
        }
    }

    /**
     * Step 3.5: Assigned engineer places ticket on hold / pending (IN_PROGRESS -> PENDING)
     */
    @PutMapping("/{id}/pending")
    public ResponseEntity<?> holdPending(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        try {
            User engineer = (User) userService.loadUserByUsername(auth.getName());
            String reason = body != null ? body.getOrDefault("reason", "") : "";
            Ticket updated = ticketService.holdTicketAsPending(id, reason, engineer);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to hold ticket: " + e.getMessage()));
        }
    }

    /**
     * Step 4: Assigned engineer marks ticket as SOLVED (IN_PROGRESS/PENDING -> SOLVED)
     */
    @PutMapping("/{id}/solve")
    public ResponseEntity<?> solveTicket(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        try {
            User engineer = (User) userService.loadUserByUsername(auth.getName());
            String resolution = body != null ? body.getOrDefault("resolution", "") : "";
            String solutionAttachmentBase64 = body != null ? body.get("solutionAttachmentBase64") : null;
            String solutionAttachmentName = body != null ? body.get("solutionAttachmentName") : null;
            Ticket solved = ticketService.solveTicket(id, resolution, solutionAttachmentBase64, solutionAttachmentName, engineer);
            return ResponseEntity.ok(solved);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to solve ticket: " + e.getMessage()));
        }
    }

    /**
     * Step 5: Employee / Admin / Engineer confirms solution and closes ticket (SOLVED -> CLOSED)
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeTicket(@PathVariable Long id, Authentication auth) {
        try {
            User user = (User) userService.loadUserByUsername(auth.getName());
            Ticket closed = ticketService.closeTicket(id, user);
            return ResponseEntity.ok(closed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to close ticket: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveTicketAlias(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return solveTicket(id, body, auth);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ticket> update(@PathVariable Long id, @RequestBody Ticket body) {
        return ticketService.findById(id).map(existing -> {
            if (body.getStatus() != null && !body.getStatus().isBlank()) existing.setStatus(body.getStatus().toUpperCase());
            if (body.getResolution() != null) existing.setResolution(body.getResolution());
            if (body.getPriority() != null && !body.getPriority().isBlank()) existing.setPriority(body.getPriority().toUpperCase());
            if (body.getTitle() != null && !body.getTitle().isBlank()) existing.setTitle(body.getTitle());
            if (body.getSubject() != null && !body.getSubject().isBlank()) existing.setSubject(body.getSubject());
            if (body.getDescription() != null && !body.getDescription().isBlank()) existing.setDescription(body.getDescription());
            if (body.getTags() != null) existing.setTags(body.getTags());
            if (body.getCategory() != null) existing.setCategory(body.getCategory());
            if (body.getDepartment() != null) existing.setDepartment(body.getDepartment());
            if (body.getAssignedTo() != null) existing.setAssignedTo(body.getAssignedTo());
            
            existing.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(ticketService.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ticketService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Module 6/8: Semantic Duplicate Ticket Merging Endpoint ───────────────────
    @PostMapping("/{id}/merge")
    public ResponseEntity<?> mergeTicket(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            if (body == null || !body.containsKey("targetTicketId")) {
                return ResponseEntity.badRequest().body(Map.of("error", "targetTicketId is required for ticket merge."));
            }
            Long targetTicketId = Long.valueOf(body.get("targetTicketId").toString());
            String reason = (String) body.getOrDefault("reason", "Duplicate request merged by support team");
            User user = null;
            if (auth != null && auth.getName() != null) {
                user = (User) userService.loadUserByUsername(auth.getName());
            }
            Ticket merged = ticketService.mergeTicket(id, targetTicketId, reason, user);
            return ResponseEntity.ok(merged);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Merge failed: " + e.getMessage()));
        }
    }

    // ── Module 6/8: SLA Breach Risk Prediction Engine Endpoint ──────────────────
    @GetMapping("/sla-breach-predictions")
    public ResponseEntity<?> getSlaBreachPredictions() {
        try {
            return ResponseEntity.ok(ticketService.getSlaBreachPredictions());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Module 8: Multi-Channel Unified Ticket Ingestion ────────────────────────
    @PostMapping("/channel-ingest")
    public ResponseEntity<?> channelIngest(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            User user = null;
            if (auth != null && auth.getName() != null) {
                user = (User) userService.loadUserByUsername(auth.getName());
            }
            Ticket created = ticketService.createTicketFromChannel(payload, user);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Channel ingestion failed: " + e.getMessage()));
        }
    }

    // ── Module 6: Live Duplicate Detection for Ticket ───────────────────────────
    @GetMapping("/{id}/duplicates")
    public ResponseEntity<?> getTicketDuplicates(@PathVariable Long id) {
        return ticketService.findById(id).map(t -> {
            List<Map<String, Object>> dups = aiService.checkDuplicates(t.getTitle(), t.getDescription());
            return ResponseEntity.ok(dups);
        }).orElse(ResponseEntity.notFound().build());
    }
}
