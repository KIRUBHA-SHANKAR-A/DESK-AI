package com.example.desk_ai.service;

import com.example.desk_ai.entity.*;
import com.example.desk_ai.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private static final Logger logger = LoggerFactory.getLogger(TicketService.class);

    private final TicketRepository repo;
    private final AIService aiService;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SLARepository slaRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final DuplicateTicketRepository duplicateTicketRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final AIRecommendationRepository aiRecommendationRepository;

    public TicketService(TicketRepository repo,
                         AIService aiService,
                         CategoryRepository categoryRepository,
                         DepartmentRepository departmentRepository,
                         UserRepository userRepository,
                         NotificationRepository notificationRepository,
                         SLARepository slaRepository,
                         TicketHistoryRepository ticketHistoryRepository,
                         DuplicateTicketRepository duplicateTicketRepository,
                         EmailService emailService,
                         NotificationService notificationService,
                         AuditLogService auditLogService,
                         CommentRepository commentRepository,
                         AttachmentRepository attachmentRepository,
                         AIRecommendationRepository aiRecommendationRepository) {
        this.repo = repo;
        this.aiService = aiService;
        this.categoryRepository = categoryRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.slaRepository = slaRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.duplicateTicketRepository = duplicateTicketRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.aiRecommendationRepository = aiRecommendationRepository;
    }

    public List<Ticket> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<Ticket> findByUserId(Long userId) {
        return repo.findByCreatedBy_UserIdOrderByCreatedAtDesc(userId);
    }

    public List<Ticket> findByAssignedToId(Long userId) {
        return repo.findByAssignedTo_UserIdOrderByCreatedAtDesc(userId);
    }

    public List<Ticket> findForSupportEngineer(User engineer) {
        if (engineer == null) {
            return List.of();
        }
        Long userId = engineer.getUserId();
        Long departmentId = (engineer.getDepartment() != null) ? engineer.getDepartment().getDepartmentId() : null;
        String deptName = (engineer.getDepartment() != null && engineer.getDepartment().getDepartmentName() != null)
                ? engineer.getDepartment().getDepartmentName().trim().toLowerCase()
                : null;

        if (departmentId != null) {
            List<Ticket> tickets = new java.util.ArrayList<>(
                repo.findByAssignedTo_UserIdOrDepartment_DepartmentIdOrderByCreatedAtDesc(userId, departmentId)
            );
            // Also include any tickets whose department name matches even if ID differed, or unassigned open tickets
            if (deptName != null && !deptName.isEmpty()) {
                List<Ticket> all = repo.findAllByOrderByCreatedAtDesc();
                java.util.Set<Long> existingIds = tickets.stream().map(Ticket::getTicketId).collect(Collectors.toSet());
                for (Ticket t : all) {
                    if (existingIds.contains(t.getTicketId())) continue;
                    if (t.getDepartment() != null && t.getDepartment().getDepartmentName() != null) {
                        String tDept = t.getDepartment().getDepartmentName().trim().toLowerCase();
                        if (tDept.contains(deptName) || deptName.contains(tDept)) {
                            tickets.add(t);
                            existingIds.add(t.getTicketId());
                        }
                    } else if (t.getDepartment() == null && "OPEN".equalsIgnoreCase(t.getStatus())) {
                        tickets.add(t);
                        existingIds.add(t.getTicketId());
                    }
                }
            }
            tickets.sort((a, b) -> {
                LocalDateTime da = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                LocalDateTime db = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                return db.compareTo(da);
            });
            return tickets;
        } else {
            return repo.findAllByOrderByCreatedAtDesc().stream()
                    .filter(t -> (t.getAssignedTo() != null && userId.equals(t.getAssignedTo().getUserId()))
                            || t.getAssignedTo() == null
                            || "OPEN".equalsIgnoreCase(t.getStatus()))
                    .collect(Collectors.toList());
        }
    }

    public Optional<Ticket> findById(Long id) {
        return repo.findById(id);
    }

    public Ticket save(Ticket ticket) {
        return repo.save(ticket);
    }

    @Transactional
    public void deleteById(Long id) {
        commentRepository.findByTicket_TicketIdOrderByCreatedAtAsc(id).forEach(commentRepository::delete);
        attachmentRepository.findAllByTicketTicketId(id).forEach(attachmentRepository::delete);
        slaRepository.findByTicket_TicketId(id).forEach(slaRepository::delete);
        ticketHistoryRepository.findByTicket_TicketId(id).forEach(ticketHistoryRepository::delete);
        duplicateTicketRepository.findByTicket_TicketId(id).forEach(duplicateTicketRepository::delete);
        duplicateTicketRepository.findBySimilarTicket_TicketId(id).forEach(duplicateTicketRepository::delete);
        aiRecommendationRepository.findByTicket_TicketId(id).forEach(aiRecommendationRepository::delete);
        repo.findAll().stream()
                .filter(t -> id.equals(t.getMergedIntoTicketId()))
                .forEach(t -> {
                    t.setMergedIntoTicketId(null);
                    repo.save(t);
                });
        repo.deleteById(id);
    }

    public long countByStatus(String status) {
        return repo.findAll().stream()
                .filter(t -> status.equalsIgnoreCase(t.getStatus()))
                .count();
    }

    /**
     * Complete AI Ticket Creation Workflow with Full Database Field Guarantee:
     * Ensures all 19 database fields in Ticket entity, as well as associated
     * SLA and TicketHistory entities, are populated.
     */
    @Transactional
    public Ticket createTicketWithAI(Ticket ticket, User createdBy) {
        LocalDateTime now = LocalDateTime.now();

        // 1. User & Timestamps
        if (createdBy == null) {
            createdBy = userRepository.findAll().stream().findFirst().orElse(null);
        }
        ticket.setCreatedBy(createdBy);
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);

        // 2. Title & Subject Normalization
        if ((ticket.getTitle() == null || ticket.getTitle().isBlank()) && ticket.getSubject() != null && !ticket.getSubject().isBlank()) {
            ticket.setTitle(ticket.getSubject());
        }
        if ((ticket.getSubject() == null || ticket.getSubject().isBlank()) && ticket.getTitle() != null && !ticket.getTitle().isBlank()) {
            ticket.setSubject(ticket.getTitle());
        }
        if (ticket.getTitle() == null || ticket.getTitle().isBlank()) {
            ticket.setTitle("Untitled Ticket");
        }
        if (ticket.getSubject() == null || ticket.getSubject().isBlank()) {
            ticket.setSubject(ticket.getTitle());
        }

        // 3. Description
        if (ticket.getDescription() == null || ticket.getDescription().isBlank()) {
            ticket.setDescription(ticket.getTitle());
        }

        // 4. AI Classification & Confidence Score
        Map<String, Object> aiClassifyResult = aiService.classifyTicket(ticket.getTitle(), ticket.getDescription());
        String predictedCategory = (String) aiClassifyResult.getOrDefault("category", "IT Support");
        Double confidenceScore = 0.50;
        if (aiClassifyResult.get("confidence") instanceof Number) {
            confidenceScore = ((Number) aiClassifyResult.get("confidence")).doubleValue();
        }
        ticket.setAiCategory(predictedCategory);
        ticket.setAiConfidenceScore(confidenceScore);

        // 5. Priority Prediction
        if (ticket.getPriority() == null || ticket.getPriority().isBlank()) {
            Map<String, Object> aiPriorityResult = aiService.predictPriority(ticket.getTitle(), ticket.getDescription());
            ticket.setPriority((String) aiPriorityResult.getOrDefault("priority", "MEDIUM"));
        } else {
            ticket.setPriority(ticket.getPriority().toUpperCase());
        }

        // 6. AI Duplicate Check & Duplicate Score
        List<Map<String, Object>> duplicates = null;
        try {
            duplicates = aiService.checkDuplicates(ticket.getTitle(), ticket.getDescription());
            double maxScore = 0.0;
            if (duplicates != null && !duplicates.isEmpty()) {
                for (Map<String, Object> dup : duplicates) {
                    if (dup.get("score") instanceof Number) {
                        maxScore = Math.max(maxScore, ((Number) dup.get("score")).doubleValue());
                    } else if (dup.get("similarity") instanceof Number) {
                        maxScore = Math.max(maxScore, ((Number) dup.get("similarity")).doubleValue());
                    }
                }
            }
            ticket.setDuplicateScore(maxScore);
        } catch (Exception e) {
            logger.warn("Duplicate check warning: {}", e.getMessage());
            ticket.setDuplicateScore(0.0);
        }

        // 6b. Auto-tagging
        if (ticket.getTags() == null || ticket.getTags().isBlank()) {
            ticket.setTags(aiService.generateAutoTags(ticket.getTitle(), ticket.getDescription(), predictedCategory, ticket.getSolutionAttachmentName()));
        }

        // 7. Due Date Calculation
        if (ticket.getDueDate() == null) {
            String p = ticket.getPriority();
            if ("CRITICAL".equalsIgnoreCase(p)) {
                ticket.setDueDate(now.plusHours(4));
            } else if ("HIGH".equalsIgnoreCase(p)) {
                ticket.setDueDate(now.plusHours(24));
            } else if ("LOW".equalsIgnoreCase(p)) {
                ticket.setDueDate(now.plusHours(72));
            } else {
                ticket.setDueDate(now.plusHours(48));
            }
        }

        // 8. Default Resolution Status
        if (ticket.getResolution() == null || ticket.getResolution().isBlank()) {
            ticket.setResolution("Pending Resolution");
        }

        // 9. Category Entity Resolution & Fallback
        if (ticket.getCategory() == null || ticket.getCategory().getCategoryId() == null) {
            List<Category> matchedCats = categoryRepository.findByCategoryNameIgnoreCase(predictedCategory);
            if (!matchedCats.isEmpty()) {
                ticket.setCategory(matchedCats.get(0));
            } else {
                // Dynamically create Category for the predicted category
                Category newCat = new Category(null, predictedCategory, predictedCategory + " Support Category", true);
                newCat = categoryRepository.save(newCat);
                ticket.setCategory(newCat);
            }
        }

        // 10. Department Entity Resolution & Fallback
        String categoryName = (ticket.getCategory() != null && ticket.getCategory().getCategoryName() != null)
                ? ticket.getCategory().getCategoryName()
                : predictedCategory;

        Department targetDept = routeToDepartment(categoryName);
        if (targetDept == null) {
            String deptName = categoryName.toLowerCase().contains("team") || categoryName.toLowerCase().contains("department")
                    ? categoryName
                    : categoryName + " Team";
            Department newDept = new Department(null, deptName, deptName + " Support Department", deptName.toLowerCase().replace(" ", "") + "@deskai.com");
            targetDept = departmentRepository.save(newDept);
        }
        ticket.setDepartment(targetDept);


        // 11. Department Queue Routing (Defaults to OPEN, unassigned so department team can claim)
        if (ticket.getStatus() == null || ticket.getStatus().isBlank()) {
            ticket.setStatus("OPEN");
        }

        // 12. Save Ticket & Generate Unique Ticket Number
        Ticket savedTicket = repo.save(ticket);
        savedTicket.setTicketNumber("TKT-" + String.format("%05d", savedTicket.getTicketId()));
        savedTicket = repo.save(savedTicket);

        // 13. Create Linked SLA Entity
        try {
            SLA sla = new SLA();
            sla.setTicket(savedTicket);
            sla.setDeadline(savedTicket.getDueDate());
            int hours = 48;
            if ("CRITICAL".equalsIgnoreCase(savedTicket.getPriority())) hours = 4;
            else if ("HIGH".equalsIgnoreCase(savedTicket.getPriority())) hours = 24;
            else if ("LOW".equalsIgnoreCase(savedTicket.getPriority())) hours = 72;
            sla.setExpectedResolutionHours(hours);
            sla.setBreached(false);
            slaRepository.save(sla);
        } catch (Exception e) {
            logger.warn("Failed to create SLA record: {}", e.getMessage());
        }

        // 14. Create Initial Ticket History Entry
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(savedTicket);
            history.setOldStatus("NONE");
            history.setNewStatus(savedTicket.getStatus());
            history.setRemarks("Ticket created with initial status OPEN.");
            history.setChangedBy(savedTicket.getCreatedBy());
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to create TicketHistory record: {}", e.getMessage());
        }

        // 15. Record Semantic Duplicate Matches (Sentence-BERT)
        if (duplicates != null && !duplicates.isEmpty()) {
            final Ticket currentTicket = savedTicket;
            for (Map<String, Object> dup : duplicates) {
                try {
                    Object simIdObj = dup.get("id");
                    if (simIdObj != null) {
                        Long simId = Long.valueOf(simIdObj.toString());
                        if (!simId.equals(currentTicket.getTicketId())) {
                            repo.findById(simId).ifPresent(simTkt -> {
                                double simScore = 0.0;
                                if (dup.get("score") instanceof Number) {
                                    simScore = ((Number) dup.get("score")).doubleValue();
                                } else if (dup.get("similarity") instanceof Number) {
                                    simScore = ((Number) dup.get("similarity")).doubleValue();
                                }
                                DuplicateTicket dt = new DuplicateTicket();
                                dt.setTicket(currentTicket);
                                dt.setSimilarTicket(simTkt);
                                dt.setSimilarityScore(simScore);
                                dt.setDetectedAt(now);
                                duplicateTicketRepository.save(dt);
                            });
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Failed to record duplicate relationship: {}", e.getMessage());
                }
            }
        }

        // 16. Notification & Audit Log
        try {
            String creatorName = savedTicket.getCreatedBy() != null ? savedTicket.getCreatedBy().getName() : "Employee";
            auditLogService.log("TICKET_CREATED", "TICKET", savedTicket.getTicketId().toString(),
                    creatorName, "USER", "Created ticket " + savedTicket.getTicketNumber() + " (" + savedTicket.getTitle() + ")");

            if (savedTicket.getAssignedTo() != null) {
                notificationService.notifyTicketAssignment(savedTicket, savedTicket.getAssignedTo());
            }
        } catch (Exception e) {
            logger.warn("Post-create notification/audit error: {}", e.getMessage());
        }

        return savedTicket;
    }

    /**
     * Step 2: Engineer Assignment Flow (OPEN -> ASSIGNED)
     */
    @Transactional
    public Ticket assignTicketToEngineer(Long ticketId, User engineer) {
        Ticket ticket = repo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "OPEN";
        if (!"OPEN".equals(currentStatus) && !"UNASSIGNED".equals(currentStatus)) {
            throw new IllegalStateException("Invalid status transition: Only OPEN tickets can be claimed. Current status is " + currentStatus);
        }

        // Department validation: Support Engineer must belong to the department of the ticket (or be ADMIN)
        boolean isAdmin = engineer.getRole() != null && "ADMIN".equalsIgnoreCase(engineer.getRole().getRoleName());
        if (!isAdmin && ticket.getDepartment() != null && engineer.getDepartment() != null) {
            Long ticketDeptId = ticket.getDepartment().getDepartmentId();
            Long engDeptId = engineer.getDepartment().getDepartmentId();
            String ticketDeptName = ticket.getDepartment().getDepartmentName() != null ? ticket.getDepartment().getDepartmentName().trim().toLowerCase() : "";
            String engDeptName = engineer.getDepartment().getDepartmentName() != null ? engineer.getDepartment().getDepartmentName().trim().toLowerCase() : "";

            boolean matchId = ticketDeptId != null && ticketDeptId.equals(engDeptId);
            boolean matchName = !ticketDeptName.isEmpty() && !engDeptName.isEmpty() &&
                    (ticketDeptName.contains(engDeptName) || engDeptName.contains(ticketDeptName));

            if (!matchId && !matchName) {
                throw new SecurityException("Access Denied: You can only claim OPEN tickets belonging to your department (" + ticket.getDepartment().getDepartmentName() + ").");
            }
        }

        if (ticket.getDepartment() == null && engineer.getDepartment() != null) {
            ticket.setDepartment(engineer.getDepartment());
        }

        LocalDateTime now = LocalDateTime.now();
        String oldStatus = ticket.getStatus();
        ticket.setAssignedTo(engineer);
        ticket.setAssignedAt(now);
        ticket.setStatus("ASSIGNED");
        ticket.setUpdatedAt(now);

        Ticket saved = repo.save(ticket);

        // Record history
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(saved);
            history.setOldStatus(oldStatus);
            history.setNewStatus("ASSIGNED");
            history.setRemarks("Claimed from department queue by engineer: " + (engineer.getName() != null ? engineer.getName() : engineer.getEmail()));
            history.setChangedBy(engineer);
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to save assignment history: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Step 3: Work Progress Flow (ASSIGNED or PENDING -> IN_PROGRESS)
     */
    @Transactional
    public Ticket startTicketProgress(Long ticketId, User engineer) {
        Ticket ticket = repo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        // Ownership validation
        boolean isAdmin = engineer.getRole() != null && "ADMIN".equalsIgnoreCase(engineer.getRole().getRoleName());
        if (!isAdmin) {
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getUserId().equals(engineer.getUserId())) {
                String ownerName = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : "Unassigned";
                throw new SecurityException("Access Denied: Only the assigned engineer (" + ownerName + ") can start work on this ticket.");
            }
        }

        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "";
        if (!"ASSIGNED".equals(currentStatus) && !"PENDING".equals(currentStatus)) {
            throw new IllegalStateException("Invalid status transition: Cannot start work on ticket with status " + currentStatus + ". Status must be ASSIGNED or PENDING.");
        }

        LocalDateTime now = LocalDateTime.now();
        String oldStatus = ticket.getStatus();
        if (ticket.getStartedAt() == null) {
            ticket.setStartedAt(now);
        }
        ticket.setStatus("IN_PROGRESS");
        ticket.setUpdatedAt(now);

        Ticket saved = repo.save(ticket);

        // Record history
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(saved);
            history.setOldStatus(oldStatus);
            history.setNewStatus("IN_PROGRESS");
            history.setRemarks("Engineer " + (engineer.getName() != null ? engineer.getName() : "Engineer") + " started/resumed active progress.");
            history.setChangedBy(engineer);
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to save progress history: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Step 3.5: Put Ticket On Hold / Pending (IN_PROGRESS -> PENDING)
     */
    @Transactional
    public Ticket holdTicketAsPending(Long ticketId, String reason, User engineer) {
        Ticket ticket = repo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        // Ownership validation
        boolean isAdmin = engineer.getRole() != null && "ADMIN".equalsIgnoreCase(engineer.getRole().getRoleName());
        if (!isAdmin) {
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getUserId().equals(engineer.getUserId())) {
                String ownerName = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : "Unassigned";
                throw new SecurityException("Access Denied: Only the assigned engineer (" + ownerName + ") can place this ticket on hold.");
            }
        }

        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "";
        if (!"IN_PROGRESS".equals(currentStatus)) {
            throw new IllegalStateException("Invalid status transition: Cannot hold ticket with status " + currentStatus + ". Ticket must be IN_PROGRESS to be placed in PENDING.");
        }

        LocalDateTime now = LocalDateTime.now();
        String holdReason = (reason != null && !reason.trim().isBlank()) ? reason.trim() : "Waiting for user response or external dependency.";
        ticket.setStatus("PENDING");
        ticket.setUpdatedAt(now);

        Ticket saved = repo.save(ticket);

        // Record history
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(saved);
            history.setOldStatus("IN_PROGRESS");
            history.setNewStatus("PENDING");
            history.setRemarks("Ticket placed on PENDING hold: " + holdReason);
            history.setChangedBy(engineer);
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to save pending history: {}", e.getMessage());
        }

        // Send Notification to Employee
        if (ticket.getCreatedBy() != null) {
            try {
                String engineerName = engineer.getName() != null && !engineer.getName().isBlank() ? engineer.getName() : "Engineer";
                String tktNum = ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ("TKT-" + ticket.getTicketId());
                Notification notif = new Notification();
                notif.setTitle("Ticket #" + tktNum + " is Awaiting Your Response");
                notif.setMessage("Engineer " + engineerName + " has placed ticket #" + tktNum + " on PENDING: " + holdReason + ". Please reply with details.");
                notif.setUser(ticket.getCreatedBy());
                notif.setIsRead(false);
                notif.setCreatedAt(now);
                notificationRepository.save(notif);
            } catch (Exception e) {
                logger.warn("Failed to send employee pending notification: {}", e.getMessage());
            }
        }

        return saved;
    }

    /**
     * Step 4: Ticket Resolution Flow (IN_PROGRESS or PENDING -> SOLVED)
     */
    @Transactional
    public Ticket solveTicket(Long ticketId, String resolution, User engineer) {
        return solveTicket(ticketId, resolution, null, null, engineer);
    }

    @Transactional
    public Ticket solveTicket(Long ticketId, String resolution, String solutionAttachmentBase64, String solutionAttachmentName, User engineer) {
        Ticket ticket = repo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        // Ownership validation
        boolean isAdmin = engineer.getRole() != null && "ADMIN".equalsIgnoreCase(engineer.getRole().getRoleName());
        if (!isAdmin) {
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getUserId().equals(engineer.getUserId())) {
                String ownerName = ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : "Unassigned";
                throw new SecurityException("Access Denied: Only the assigned engineer (" + ownerName + ") can resolve/solve this ticket.");
            }
        }

        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "";
        if (!"IN_PROGRESS".equals(currentStatus) && !"PENDING".equals(currentStatus)) {
            throw new IllegalStateException("Invalid status transition: Cannot solve ticket with status " + currentStatus + ". Ticket must be IN_PROGRESS or PENDING before being marked SOLVED.");
        }

        if (resolution == null || resolution.trim().isBlank()) {
            throw new IllegalArgumentException("Resolution details cannot be empty when solving a ticket.");
        }

        LocalDateTime now = LocalDateTime.now();
        String oldStatus = ticket.getStatus();
        ticket.setResolution(resolution.trim());
        if (solutionAttachmentBase64 != null && !solutionAttachmentBase64.isBlank()) {
            ticket.setSolutionAttachmentBase64(solutionAttachmentBase64);
            ticket.setSolutionAttachmentName(solutionAttachmentName != null ? solutionAttachmentName : "solution_attachment.png");
        }
        ticket.setSolvedAt(now);
        ticket.setResolvedAt(now);
        ticket.setSolvedBy(engineer);
        ticket.setStatus("SOLVED");
        ticket.setUpdatedAt(now);

        Ticket saved = repo.save(ticket);

        // Record history
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(saved);
            history.setOldStatus(oldStatus);
            history.setNewStatus("SOLVED");
            history.setRemarks("Ticket marked as SOLVED with solution: " + resolution.trim());
            history.setChangedBy(engineer);
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to save solved history: {}", e.getMessage());
        }

        // Send Notification & Email to Employee
        if (ticket.getCreatedBy() != null) {
            try {
                String engineerName = engineer.getName() != null && !engineer.getName().isBlank() ? engineer.getName() : "Engineer";
                String tktNum = ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ("TKT-" + ticket.getTicketId());
                Notification notif = new Notification();
                notif.setTitle("Ticket #" + tktNum + " Solved");
                notif.setMessage("Your ticket #" + tktNum + " has been solved by Engineer " + engineerName + ". Please verify the solution.");
                notif.setUser(ticket.getCreatedBy());
                notif.setIsRead(false);
                notif.setCreatedAt(now);
                notificationRepository.save(notif);
            } catch (Exception e) {
                logger.warn("Failed to send employee solved notification: {}", e.getMessage());
            }

            try {
                emailService.sendTicketResolvedEmail(saved, engineer, resolution);
            } catch (Exception e) {
                logger.warn("Failed to send ticket resolved email: {}", e.getMessage());
            }
        }

        return saved;
    }

    /**
     * Step 5: Ticket Closure Flow (SOLVED -> CLOSED)
     * Can be confirmed by the Ticket Creator (Employee), Assigned Engineer, or Admin.
     */
    @Transactional
    public Ticket closeTicket(Long ticketId, User user) {
        Ticket ticket = repo.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + ticketId));

        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getRoleName());
        boolean isCreator = ticket.getCreatedBy() != null && ticket.getCreatedBy().getUserId().equals(user.getUserId());
        boolean isAssignedEng = ticket.getAssignedTo() != null && ticket.getAssignedTo().getUserId().equals(user.getUserId());

        if (!isAdmin && !isCreator && !isAssignedEng) {
            throw new SecurityException("Access Denied: Only the employee who created the ticket, the assigned engineer, or an Admin can close this ticket.");
        }

        String currentStatus = ticket.getStatus() != null ? ticket.getStatus().toUpperCase() : "";
        if (!isAdmin && !"SOLVED".equals(currentStatus) && !"RESOLVED".equals(currentStatus)) {
            throw new IllegalStateException("Invalid status transition: Only SOLVED tickets can be closed. Current status is " + currentStatus);
        }

        LocalDateTime now = LocalDateTime.now();
        String oldStatus = ticket.getStatus();
        ticket.setStatus("CLOSED");
        ticket.setClosedAt(now);
        ticket.setClosedBy(user);
        ticket.setUpdatedAt(now);

        Ticket saved = repo.save(ticket);

        // Record history
        try {
            TicketHistory history = new TicketHistory();
            history.setTicket(saved);
            history.setOldStatus(oldStatus);
            history.setNewStatus("CLOSED");
            history.setRemarks("Ticket closed and confirmed by " + (user.getName() != null ? user.getName() : user.getEmail()) + ".");
            history.setChangedBy(user);
            history.setChangedAt(now);
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            logger.warn("Failed to save closed history: {}", e.getMessage());
        }

        // If closed by Employee, notify Assigned Engineer
        if (isCreator && ticket.getAssignedTo() != null) {
            try {
                String tktNum = ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ("TKT-" + ticket.getTicketId());
                Notification notif = new Notification();
                notif.setTitle("Ticket #" + tktNum + " Closed");
                notif.setMessage("Employee " + (user.getName() != null ? user.getName() : "Employee") + " has confirmed the resolution and closed ticket #" + tktNum + ".");
                notif.setUser(ticket.getAssignedTo());
                notif.setIsRead(false);
                notif.setCreatedAt(now);
                notificationRepository.save(notif);
            } catch (Exception e) {
                logger.warn("Failed to send engineer closure notification: {}", e.getMessage());
            }
        }

        return saved;
    }

    private Department routeToDepartment(String categoryName) {
        if (categoryName == null) return null;

        // Try direct name search first
        List<Department> matchedDepts = departmentRepository.findByDepartmentNameContainingIgnoreCase(categoryName);
        if (!matchedDepts.isEmpty()) {
            return matchedDepts.get(0);
        }

        // Search among all departments for partial matches
        List<Department> depts = departmentRepository.findAll();
        for (Department d : depts) {
            if (d.getDepartmentName() == null) continue;
            String dName = d.getDepartmentName().toLowerCase();
            String cName = categoryName.toLowerCase();
            if (dName.contains(cName) || cName.contains(dName)) {
                return d;
            }
        }

        // Fallback to first department if available
        return depts.isEmpty() ? null : depts.get(0);
    }

    private User findAvailableSupportEngineer(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        List<User> engineers = userRepository.findByDepartment_DepartmentIdAndRole_RoleNameAndActiveTrue(departmentId, "SUPPORT_ENGINEER");
        if (!engineers.isEmpty()) {
            return engineers.get(0);
        }
        return null;
    }

    // ── Module 6/8: Semantic Duplicate Ticket Merging ────────────────────────────
    @Transactional
    public Ticket mergeTicket(Long sourceTicketId, Long targetTicketId, String reason, User currentUser) {
        Ticket source = repo.findById(sourceTicketId)
                .orElseThrow(() -> new IllegalArgumentException("Source ticket not found: " + sourceTicketId));
        Ticket target = repo.findById(targetTicketId)
                .orElseThrow(() -> new IllegalArgumentException("Target ticket not found: " + targetTicketId));

        if (source.getTicketId().equals(target.getTicketId())) {
            throw new IllegalArgumentException("Cannot merge a ticket into itself.");
        }

        LocalDateTime now = LocalDateTime.now();
        String oldStatus = source.getStatus();
        source.setStatus("CLOSED");
        source.setMergedIntoTicketId(target.getTicketId());
        source.setResolution("Merged into Ticket " + target.getTicketNumber() + " (" + target.getTitle() + "). Reason: " + (reason != null ? reason : "Duplicate issue report"));
        source.setClosedAt(now);
        source.setClosedBy(currentUser);
        source.setUpdatedAt(now);
        Ticket savedSource = repo.save(source);

        // Record duplicate relationship
        DuplicateTicket dup = new DuplicateTicket();
        dup.setTicket(savedSource);
        dup.setSimilarTicket(target);
        dup.setSimilarityScore(savedSource.getDuplicateScore() != null ? savedSource.getDuplicateScore() : 0.92);
        dup.setDetectedAt(now);
        duplicateTicketRepository.save(dup);

        // Record history on source ticket
        try {
            TicketHistory h1 = new TicketHistory();
            h1.setTicket(savedSource);
            h1.setOldStatus(oldStatus);
            h1.setNewStatus("CLOSED");
            h1.setRemarks("Merged into Ticket " + target.getTicketNumber() + ". Reason: " + reason);
            h1.setChangedBy(currentUser);
            h1.setChangedAt(now);
            ticketHistoryRepository.save(h1);
        } catch (Exception ignored) {}

        // Record history on target ticket
        try {
            TicketHistory h2 = new TicketHistory();
            h2.setTicket(target);
            h2.setRemarks("Duplicate Ticket " + savedSource.getTicketNumber() + " was merged into this ticket. Reason: " + reason);
            h2.setChangedBy(currentUser);
            h2.setChangedAt(now);
            ticketHistoryRepository.save(h2);
        } catch (Exception ignored) {}

        // Notify source ticket creator
        if (savedSource.getCreatedBy() != null) {
            notificationService.notifyUser(savedSource.getCreatedBy(),
                    "Ticket Merged: " + savedSource.getTicketNumber(),
                    "Your ticket " + savedSource.getTicketNumber() + " was merged into active ticket " + target.getTicketNumber() + " (" + target.getTitle() + ").");
        }

        // Audit log
        String opName = currentUser != null ? currentUser.getName() : "System";
        auditLogService.log("TICKET_MERGED", "TICKET", sourceTicketId.toString(),
                opName, currentUser != null && currentUser.getRole() != null ? currentUser.getRole().getRoleName() : "ADMIN",
                "Merged ticket " + savedSource.getTicketNumber() + " into " + target.getTicketNumber() + " (" + reason + ")");

        return savedSource;
    }

    // ── Module 6/8: SLA Breach Risk Prediction Engine ──────────────────────────
    public Map<String, Object> getSlaBreachPredictions() {
        List<Ticket> activeTickets = repo.findAll().stream()
                .filter(t -> !"RESOLVED".equalsIgnoreCase(t.getStatus()) && !"CLOSED".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());

        List<Map<String, Object>> ticketMaps = activeTickets.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("ticket_id", t.getTicketId());
            m.put("title", t.getTitle());
            m.put("priority", t.getPriority() != null ? t.getPriority() : "MEDIUM");
            m.put("category", t.getCategory() != null ? t.getCategory().getCategoryName() : t.getAiCategory());
            m.put("status", t.getStatus());
            m.put("created_at", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            m.put("due_date", t.getDueDate() != null ? t.getDueDate().toString() : null);
            m.put("assigned_to", t.getAssignedTo() != null ? t.getAssignedTo().getName() : null);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = aiService.predictSlaBreach(ticketMaps);

        // Check if any tickets are CRITICAL or HIGH risk and trigger SLA alerts
        if (result != null && result.get("predictions") instanceof List) {
            List<?> preds = (List<?>) result.get("predictions");
            for (Object item : preds) {
                if (item instanceof Map) {
                    Map<?, ?> p = (Map<?, ?>) item;
                    String riskLevel = String.valueOf(p.get("risk_level"));
                    if ("CRITICAL".equalsIgnoreCase(riskLevel) || "HIGH".equalsIgnoreCase(riskLevel)) {
                        Object tId = p.get("ticket_id");
                        if (tId != null) {
                            try {
                                repo.findById(Long.valueOf(tId.toString())).ifPresent(t -> {
                                    List<?> reasons = (List<?>) p.get("reasons");
                                    String reason = reasons != null && !reasons.isEmpty() ? String.valueOf(reasons.get(0)) : "Resolution deadline imminent";
                                    notificationService.notifySlaBreach(t, riskLevel, reason);
                                });
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }
        }

        return result;
    }

    // ── Module 8: Multi-Channel Unified Ticket Ingestion ────────────────────────
    @Transactional
    public Ticket createTicketFromChannel(Map<String, Object> payload, User authUser) {
        String source = (String) payload.getOrDefault("source", "PORTAL");
        String title = (String) payload.getOrDefault("title", "Support Request");
        String description = (String) payload.getOrDefault("description", "");
        String senderEmail = (String) payload.get("email");

        User creator = authUser;
        if (creator == null && senderEmail != null && !senderEmail.isBlank()) {
            creator = userRepository.findByEmail(senderEmail).orElse(null);
        }

        Ticket t = new Ticket();
        t.setTitle(title);
        t.setDescription(description);
        t.setSourceChannel(source.toUpperCase());
        return createTicketWithAI(t, creator);
    }
}

