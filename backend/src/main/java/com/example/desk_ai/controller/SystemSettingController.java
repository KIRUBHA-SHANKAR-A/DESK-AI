package com.example.desk_ai.controller;

import com.example.desk_ai.entity.SystemSetting;
import com.example.desk_ai.service.AuditLogService;
import com.example.desk_ai.service.SystemSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/system-settings")
public class SystemSettingController {

    private final SystemSettingService service;
    private final AuditLogService auditLogService;

    public SystemSettingController(SystemSettingService service, AuditLogService auditLogService) {
        this.service = service;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getAllMap() {
        return ResponseEntity.ok(service.getAllAsMap());
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemSetting> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String value = body.getOrDefault("value", "");
        SystemSetting updated = service.updateSetting(key, value);

        String username = auth != null ? auth.getName() : "ADMIN";
        auditLogService.log("SETTING_UPDATED", "SYSTEM", key, username, "ADMIN",
                "Updated setting '" + key + "' to '" + value + "'");

        return ResponseEntity.ok(updated);
    }

    @PostMapping("/batch")
    public ResponseEntity<Map<String, String>> updateBatch(
            @RequestBody Map<String, String> settings,
            Authentication auth) {
        service.updateBatch(settings);

        String username = auth != null ? auth.getName() : "ADMIN";
        auditLogService.log("SETTINGS_BATCH_UPDATED", "SYSTEM", "BATCH", username, "ADMIN",
                "Updated " + settings.size() + " system configuration settings");

        return ResponseEntity.ok(service.getAllAsMap());
    }
}
