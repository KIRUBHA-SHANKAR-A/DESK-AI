package com.example.desk_ai.service;

import com.example.desk_ai.entity.Attachment;
import com.example.desk_ai.repository.AttachmentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AttachmentService {
    private final AttachmentRepository repo;

    public AttachmentService(AttachmentRepository repo) {
        this.repo = repo;
    }

    public List<Attachment> findAll() {
        return repo.findAll();
    }

    public Optional<Attachment> findById(Long id) {
        return repo.findById(id);
    }

    public List<Attachment> findByTicketId(Long ticketId) {
        return repo.findAllByTicketTicketId(ticketId);
    }

    public Attachment save(Attachment a) {
        return repo.save(a);
    }

    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}
