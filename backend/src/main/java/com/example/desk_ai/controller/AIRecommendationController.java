package com.example.desk_ai.controller;

import com.example.desk_ai.entity.AIRecommendation;
import com.example.desk_ai.service.AIRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ai-recommendations")
public class AIRecommendationController {
    private final AIRecommendationService service;
    public AIRecommendationController(AIRecommendationService service) { this.service = service; }
    @GetMapping public List<AIRecommendation> all() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<AIRecommendation> get(@PathVariable Long id) { return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public AIRecommendation create(@RequestBody AIRecommendation a) { return service.save(a); }
    @PutMapping("/{id}") public ResponseEntity<AIRecommendation> update(@PathVariable Long id, @RequestBody AIRecommendation a) { a.setRecommendationId(id); return ResponseEntity.ok(service.save(a)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteById(id); return ResponseEntity.noContent().build(); }
}
