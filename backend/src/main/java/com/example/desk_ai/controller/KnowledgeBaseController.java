package com.example.desk_ai.controller;

import com.example.desk_ai.entity.Category;
import com.example.desk_ai.entity.KnowledgeBase;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.repository.CategoryRepository;
import com.example.desk_ai.repository.TicketRepository;
import com.example.desk_ai.service.AIService;
import com.example.desk_ai.service.KnowledgeBaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/knowledgebase", "/api/knowledge-base"})
public class KnowledgeBaseController {

    private final KnowledgeBaseService service;
    private final AIService aiService;
    private final TicketRepository ticketRepository;
    private final CategoryRepository categoryRepository;

    public KnowledgeBaseController(KnowledgeBaseService service,
                                   AIService aiService,
                                   TicketRepository ticketRepository,
                                   CategoryRepository categoryRepository) {
        this.service = service;
        this.aiService = aiService;
        this.ticketRepository = ticketRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<KnowledgeBase> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeBase> get(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<KnowledgeBase> create(@RequestBody KnowledgeBase k) {
        if (k.getCategory() != null && k.getCategory().getCategoryId() != null) {
            categoryRepository.findById(k.getCategory().getCategoryId()).ifPresent(k::setCategory);
        }
        if (k.getCreatedAt() == null) k.setCreatedAt(LocalDateTime.now());
        if (k.getUpdatedAt() == null) k.setUpdatedAt(LocalDateTime.now());
        if (k.getActive() == null) k.setActive(true);
        if (k.getViews() == null) k.setViews(0);
        return ResponseEntity.ok(service.save(k));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeBase> update(@PathVariable Long id, @RequestBody KnowledgeBase body) {
        return service.findById(id).map(existing -> {
            if (body.getTitle() != null && !body.getTitle().isBlank()) existing.setTitle(body.getTitle());
            if (body.getSummary() != null) existing.setSummary(body.getSummary());
            if (body.getContent() != null && !body.getContent().isBlank()) existing.setContent(body.getContent());
            if (body.getKeywords() != null) existing.setKeywords(body.getKeywords());
            if (body.getCategory() != null && body.getCategory().getCategoryId() != null) {
                categoryRepository.findById(body.getCategory().getCategoryId()).ifPresent(existing::setCategory);
            } else if (body.getCategory() == null) {
                existing.setCategory(null);
            }
            if (body.getAttachmentBase64() != null) existing.setAttachmentBase64(body.getAttachmentBase64());
            if (body.getAttachmentName() != null) existing.setAttachmentName(body.getAttachmentName());
            if (body.getAttachmentType() != null) existing.setAttachmentType(body.getAttachmentType());
            existing.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(service.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Module 7: Auto Knowledge Base Generation from Resolved Tickets ──────────
    @PostMapping("/auto-generate")
    public ResponseEntity<?> autoGenerateKb(@RequestBody(required = false) Map<String, Object> body) {
        try {
            int minClusterSize = 2;
            if (body != null && body.containsKey("minClusterSize")) {
                minClusterSize = Integer.parseInt(body.get("minClusterSize").toString());
            }

            List<Ticket> resolvedTickets = ticketRepository.findAll().stream()
                    .filter(t -> ("RESOLVED".equalsIgnoreCase(t.getStatus()) || "CLOSED".equalsIgnoreCase(t.getStatus()))
                            && t.getResolution() != null && !t.getResolution().isBlank())
                    .collect(Collectors.toList());

            if (resolvedTickets.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "ok",
                        "articlesGenerated", 0,
                        "message", "No resolved tickets with resolution text available for clustering."
                ));
            }

            List<Map<String, Object>> ticketsPayload = resolvedTickets.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", t.getTicketId());
                m.put("title", t.getTitle());
                m.put("description", t.getDescription());
                m.put("status", t.getStatus());
                m.put("resolution", t.getResolution());
                m.put("category", t.getCategory() != null ? t.getCategory().getCategoryName() : "General Support");
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> aiResult = aiService.generateKbArticles(ticketsPayload, minClusterSize);
            List<KnowledgeBase> savedArticles = new ArrayList<>();

            if (aiResult != null && aiResult.get("articles") instanceof List) {
                List<?> arts = (List<?>) aiResult.get("articles");
                for (Object item : arts) {
                    if (item instanceof Map) {
                        Map<?, ?> artMap = (Map<?, ?>) item;
                        String title = String.valueOf(artMap.get("title"));
                        String content = String.valueOf(artMap.get("content"));
                        String summary = String.valueOf(artMap.get("summary"));

                        // Check if article with similar title already exists
                        boolean exists = service.findAll().stream()
                                .anyMatch(k -> k.getTitle() != null && k.getTitle().equalsIgnoreCase(title));

                        if (!exists) {
                            KnowledgeBase kb = new KnowledgeBase();
                            kb.setTitle(title);
                            kb.setContent(content);
                            kb.setSummary(summary);
                            kb.setKeywords("auto-generated, faq, resolved-issues");
                            kb.setActive(true);
                            kb.setCreatedAt(LocalDateTime.now());
                            kb.setUpdatedAt(LocalDateTime.now());

                            // Attach to default category if possible
                            categoryRepository.findAll().stream().findFirst().ifPresent(kb::setCategory);

                            savedArticles.add(service.save(kb));
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "articlesGenerated", savedArticles.size(),
                    "articles", savedArticles,
                    "resolvedTicketsAnalyzed", resolvedTickets.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Auto KB generation failed: " + e.getMessage()));
        }
    }

    // ── Module 7: Semantic Search / RAG Recommendation ───────────────────────────
    @PostMapping("/search")
    public ResponseEntity<?> searchKnowledgeBase(@RequestBody Map<String, String> query) {
        String title = query.getOrDefault("title", "");
        String description = query.getOrDefault("description", query.getOrDefault("query", ""));
        return ResponseEntity.ok(service.searchMatchingArticles(title, description));
    }
}
