package com.example.desk_ai.controller;

import com.example.desk_ai.entity.AuditLog;
import com.example.desk_ai.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "100") int limit) {
        if (entityType != null && !entityType.isBlank()) {
            return ResponseEntity.ok(service.findByEntityType(entityType.toUpperCase()));
        }
        return ResponseEntity.ok(service.findRecent());
    }
}
