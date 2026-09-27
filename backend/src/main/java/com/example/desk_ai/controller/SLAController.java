package com.example.desk_ai.controller;

import com.example.desk_ai.entity.SLA;
import com.example.desk_ai.service.SLAService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/slas")
public class SLAController {
    private final SLAService service;
    public SLAController(SLAService service) { this.service = service; }
    @GetMapping public List<SLA> all() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<SLA> get(@PathVariable Long id) { return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public SLA create(@RequestBody SLA s) { return service.save(s); }
    @PutMapping("/{id}") public ResponseEntity<SLA> update(@PathVariable Long id, @RequestBody SLA s) { s.setSlaId(id); return ResponseEntity.ok(service.save(s)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteById(id); return ResponseEntity.noContent().build(); }
}
