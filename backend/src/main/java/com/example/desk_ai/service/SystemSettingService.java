package com.example.desk_ai.service;

import com.example.desk_ai.entity.SystemSetting;
import com.example.desk_ai.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SystemSettingService {

    private final SystemSettingRepository repo;

    public SystemSettingService(SystemSettingRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    public void initDefaults() {
        initDefault("sla_hours_p1", "4", "Resolution SLA deadline for P1 Critical tickets (hours)");
        initDefault("sla_hours_p2", "24", "Resolution SLA deadline for P2 High tickets (hours)");
        initDefault("sla_hours_p3", "48", "Resolution SLA deadline for P3 Medium tickets (hours)");
        initDefault("sla_hours_p4", "72", "Resolution SLA deadline for P4 Low tickets (hours)");
        initDefault("auto_assignment_enabled", "true", "Automatically route and assign new tickets to engineers");
        initDefault("duplicate_threshold", "0.75", "Sentence-BERT cosine similarity threshold for duplicate detection");
        initDefault("company_name", "DESK AI Enterprise", "Organization helpdesk name");
        initDefault("support_email", "itsupport@deskai.com", "Primary support notification email");
        initDefault("enable_email_alerts", "true", "Enable real-time email dispatch for ticket notifications");
    }

    private void initDefault(String key, String value, String desc) {
        if (!repo.existsBySettingKey(key)) {
            repo.save(new SystemSetting(key, value, desc));
        }
    }

    public List<SystemSetting> getAll() {
        return repo.findAll();
    }

    public Map<String, String> getAllAsMap() {
        List<SystemSetting> list = repo.findAll();
        Map<String, String> map = new HashMap<>();
        for (SystemSetting s : list) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    public String getValue(String key, String defaultValue) {
        return repo.findBySettingKey(key).map(SystemSetting::getSettingValue).orElse(defaultValue);
    }

    public SystemSetting updateSetting(String key, String value) {
        Optional<SystemSetting> opt = repo.findBySettingKey(key);
        SystemSetting s;
        if (opt.isPresent()) {
            s = opt.get();
            s.setSettingValue(value);
            s.setUpdatedAt(LocalDateTime.now());
        } else {
            s = new SystemSetting(key, value, "System configuration parameter");
        }
        return repo.save(s);
    }

    public void updateBatch(Map<String, String> settings) {
        for (Map.Entry<String, String> e : settings.entrySet()) {
            updateSetting(e.getKey(), e.getValue());
        }
    }
}
