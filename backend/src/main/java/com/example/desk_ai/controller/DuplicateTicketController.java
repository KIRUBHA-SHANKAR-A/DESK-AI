package com.example.desk_ai.controller;

import com.example.desk_ai.entity.DuplicateTicket;
import com.example.desk_ai.service.DuplicateTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/duplicate-tickets")
public class DuplicateTicketController {
    private final DuplicateTicketService service;
    public DuplicateTicketController(DuplicateTicketService service) { this.service = service; }
    @GetMapping public List<DuplicateTicket> all() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<DuplicateTicket> get(@PathVariable Long id) { return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public DuplicateTicket create(@RequestBody DuplicateTicket d) { return service.save(d); }
    @PutMapping("/{id}") public ResponseEntity<DuplicateTicket> update(@PathVariable Long id, @RequestBody DuplicateTicket d) { d.setDuplicateId(id); return ResponseEntity.ok(service.save(d)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.deleteById(id); return ResponseEntity.noContent().build(); }
}
