package com.example.desk_ai.controller;

import com.example.desk_ai.entity.Notification;
import com.example.desk_ai.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> get(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Notification create(@RequestBody Notification n) {
        return service.save(n);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notification> update(@PathVariable Long id, @RequestBody Notification n) {
        n.setNotificationId(id);
        return ResponseEntity.ok(service.save(n));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead() {
        List<Notification> allNotifs = service.findAll();
        allNotifs.forEach(n -> n.setIsRead(true));
        allNotifs.forEach(service::save);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        return service.findById(id).map(n -> {
            n.setIsRead(true);
            return ResponseEntity.ok(service.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

