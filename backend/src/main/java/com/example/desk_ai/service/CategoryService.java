package com.example.desk_ai.service;

import com.example.desk_ai.entity.Category;
import com.example.desk_ai.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import com.example.desk_ai.repository.TicketRepository;
import com.example.desk_ai.repository.KnowledgeBaseRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    private final CategoryRepository repo;
    private final TicketRepository ticketRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;

    public CategoryService(CategoryRepository repo,
                           TicketRepository ticketRepository,
                           KnowledgeBaseRepository knowledgeBaseRepository) {
        this.repo = repo;
        this.ticketRepository = ticketRepository;
        this.knowledgeBaseRepository = knowledgeBaseRepository;
    }

    public List<Category> findAll() { return repo.findAll(); }
    public Optional<Category> findById(Long id) { return repo.findById(id); }
    public Category save(Category c) { return repo.save(c); }

    @Transactional
    public void deleteById(Long id) {
        ticketRepository.findByCategory_CategoryId(id).forEach(t -> {
            t.setCategory(null);
            ticketRepository.save(t);
        });
        knowledgeBaseRepository.findByCategory_CategoryId(id).forEach(kb -> {
            kb.setCategory(null);
            knowledgeBaseRepository.save(kb);
        });
        repo.deleteById(id);
    }
}
