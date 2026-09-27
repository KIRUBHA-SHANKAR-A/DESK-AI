package com.example.desk_ai.service;

import com.example.desk_ai.entity.SLA;
import com.example.desk_ai.repository.SLARepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SLAService {
    private final SLARepository repo;
    public SLAService(SLARepository repo) { this.repo = repo; }
    public List<SLA> findAll() { return repo.findAll(); }
    public Optional<SLA> findById(Long id) { return repo.findById(id); }
    public SLA save(SLA s) { return repo.save(s); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
