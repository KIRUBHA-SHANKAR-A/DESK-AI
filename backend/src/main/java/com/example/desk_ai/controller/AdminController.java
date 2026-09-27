package com.example.desk_ai.controller;

import com.example.desk_ai.entity.*;
import com.example.desk_ai.repository.*;
import com.example.desk_ai.service.AuditLogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;
    private final KnowledgeBaseRepository kbRepository;
    private final AuditLogService auditLogService;

    public AdminController(TicketRepository ticketRepository,
                           UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           DepartmentRepository departmentRepository,
                           KnowledgeBaseRepository kbRepository,
                           AuditLogService auditLogService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.departmentRepository = departmentRepository;
        this.kbRepository = kbRepository;
        this.auditLogService = auditLogService;
    }

    // ── Module 10: Full System Database Backup ──────────────────────────────────
    @GetMapping("/backup")
    public ResponseEntity<Map<String, Object>> backupDatabase(Authentication auth) {
        String adminUser = auth != null ? auth.getName() : "ADMIN";

        Map<String, Object> backup = new HashMap<>();
        backup.put("timestamp", LocalDateTime.now().toString());
        backup.put("system", "DESK AI Intelligent Helpdesk");
        backup.put("version", "2.0.0");
        backup.put("exportedBy", adminUser);

        List<Ticket> tickets = ticketRepository.findAll();
        List<Category> categories = categoryRepository.findAll();
        List<Department> departments = departmentRepository.findAll();
        List<KnowledgeBase> kbArticles = kbRepository.findAll();

        backup.put("ticketsCount", tickets.size());
        backup.put("categoriesCount", categories.size());
        backup.put("departmentsCount", departments.size());
        backup.put("kbCount", kbArticles.size());

        backup.put("tickets", tickets);
        backup.put("categories", categories);
        backup.put("departments", departments);
        backup.put("knowledgeBase", kbArticles);

        auditLogService.log("DATABASE_BACKUP_EXPORTED", "SYSTEM", "BACKUP", adminUser, "ADMIN",
                "Exported full database backup (" + tickets.size() + " tickets, " + kbArticles.size() + " KB articles)");

        String filename = "desk_ai_backup_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(backup);
    }

    // ── Module 10: Database Restore ─────────────────────────────────────────────
    @PostMapping("/restore")
    public ResponseEntity<?> restoreDatabase(@RequestBody Map<String, Object> payload, Authentication auth) {
        String adminUser = auth != null ? auth.getName() : "ADMIN";
        try {
            int restoredCategories = 0;
            int restoredDepartments = 0;

            if (payload.containsKey("categories") && payload.get("categories") instanceof List) {
                List<?> cats = (List<?>) payload.get("categories");
                for (Object item : cats) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> m = (Map<String, Object>) item;
                        String name = (String) m.get("categoryName");
                        if (name != null && !name.isBlank()) {
                            if (categoryRepository.findByCategoryNameIgnoreCase(name).isEmpty()) {
                                Category c = new Category();
                                c.setCategoryName(name);
                                Object descObj = m.get("description");
                                c.setDescription(descObj != null ? descObj.toString() : "Restored category");
                                c.setActive(true);
                                categoryRepository.save(c);
                                restoredCategories++;
                            }
                        }
                    }
                }
            }

            if (payload.containsKey("departments") && payload.get("departments") instanceof List) {
                List<?> depts = (List<?>) payload.get("departments");
                for (Object item : depts) {
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> m = (Map<String, Object>) item;
                        String name = (String) m.get("departmentName");
                        if (name != null && !name.isBlank()) {
                            if (departmentRepository.findByDepartmentNameIgnoreCase(name).isEmpty()) {
                                Department d = new Department();
                                d.setDepartmentName(name);
                                Object descObj = m.get("description");
                                d.setDescription(descObj != null ? descObj.toString() : "Restored department");
                                Object emailObj = m.get("email");
                                d.setEmail(emailObj != null ? emailObj.toString() : (name.toLowerCase().replace(" ", "") + "@deskai.com"));
                                departmentRepository.save(d);
                                restoredDepartments++;
                            }
                        }
                    }
                }
            }

            auditLogService.log("DATABASE_RESTORED", "SYSTEM", "RESTORE", adminUser, "ADMIN",
                    "Restored database snapshot: " + restoredCategories + " categories, " + restoredDepartments + " departments.");

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Database restore completed successfully.",
                    "categoriesRestored", restoredCategories,
                    "departmentsRestored", restoredDepartments
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Restore failed: " + e.getMessage()));
        }
    }
}
