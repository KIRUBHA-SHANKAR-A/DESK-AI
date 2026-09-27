package com.example.desk_ai.service;

import com.example.desk_ai.entity.DuplicateTicket;
import com.example.desk_ai.repository.DuplicateTicketRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DuplicateTicketService {
    private final DuplicateTicketRepository repo;
    public DuplicateTicketService(DuplicateTicketRepository repo) { this.repo = repo; }
    public List<DuplicateTicket> findAll() { return repo.findAll(); }
    public Optional<DuplicateTicket> findById(Long id) { return repo.findById(id); }
    public DuplicateTicket save(DuplicateTicket d) { return repo.save(d); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
