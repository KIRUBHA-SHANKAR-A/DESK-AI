package com.example.desk_ai.service;

import com.example.desk_ai.entity.AuditLog;
import com.example.desk_ai.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    private final AuditLogRepository repo;

    public AuditLogService(AuditLogRepository repo) {
        this.repo = repo;
    }

    public AuditLog log(String action, String entityType, String entityId, String performedBy, String userRole, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setPerformedBy(performedBy != null ? performedBy : "SYSTEM");
            entry.setUserRole(userRole != null ? userRole : "SYSTEM");
            entry.setDetails(details);
            entry.setTimestamp(LocalDateTime.now());
            return repo.save(entry);
        } catch (Exception e) {
            logger.warn("Failed to write audit log: {}", e.getMessage());
            return null;
        }
    }

    public List<AuditLog> findAll() {
        return repo.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> findRecent() {
        return repo.findTop100ByOrderByTimestampDesc();
    }

    public List<AuditLog> findByEntityType(String entityType) {
        return repo.findByEntityTypeOrderByTimestampDesc(entityType);
    }
}
