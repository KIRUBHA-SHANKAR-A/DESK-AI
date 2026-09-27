package com.example.desk_ai.service;

import com.example.desk_ai.entity.TicketHistory;
import com.example.desk_ai.repository.TicketHistoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TicketHistoryService {
    private final TicketHistoryRepository repo;
    public TicketHistoryService(TicketHistoryRepository repo) { this.repo = repo; }
    public List<TicketHistory> findAll() { return repo.findAll(); }
    public Optional<TicketHistory> findById(Long id) { return repo.findById(id); }
    public TicketHistory save(TicketHistory t) { return repo.save(t); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
