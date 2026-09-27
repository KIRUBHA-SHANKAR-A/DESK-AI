package com.example.desk_ai.controller;

import com.example.desk_ai.entity.TicketHistory;
import com.example.desk_ai.service.TicketHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ticket-history")
public class TicketHistoryController {
    private final TicketHistoryService service;
    public TicketHistoryController(TicketHistoryService service) { this.service = service; }
    @GetMapping public List<TicketHistory> all() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<TicketHistory> get(@PathVariable Long id) { return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public TicketHistory create(@RequestBody TicketHistory t) { return service.save(t); }
    @PutMapping("/{id}") public ResponseEntity<TicketHistory> update(@PathVariable Long id, @RequestBody TicketHistory t) { t.setHistoryId(id); return ResponseEntity.ok(service.save(t)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteById(id); return ResponseEntity.noContent().build(); }
}
