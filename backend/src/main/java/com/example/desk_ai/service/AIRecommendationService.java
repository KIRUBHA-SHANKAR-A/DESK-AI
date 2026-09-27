package com.example.desk_ai.service;

import com.example.desk_ai.entity.AIRecommendation;
import com.example.desk_ai.repository.AIRecommendationRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AIRecommendationService {
    private final AIRecommendationRepository repo;
    public AIRecommendationService(AIRecommendationRepository repo) { this.repo = repo; }
    public List<AIRecommendation> findAll() { return repo.findAll(); }
    public Optional<AIRecommendation> findById(Long id) { return repo.findById(id); }
    public AIRecommendation save(AIRecommendation a) { return repo.save(a); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
