package com.example.desk_ai.service;

import com.example.desk_ai.entity.Comment;
import com.example.desk_ai.repository.CommentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CommentService {
    private final CommentRepository repo;
    public CommentService(CommentRepository repo) { this.repo = repo; }
    public List<Comment> findAll() { return repo.findAll(); }
    public Optional<Comment> findById(Long id) { return repo.findById(id); }
    public List<Comment> findByTicketId(Long ticketId) { return repo.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId); }
    public Comment save(Comment c) { return repo.save(c); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
