package com.example.desk_ai.service;

import com.example.desk_ai.entity.KnowledgeBase;
import com.example.desk_ai.repository.KnowledgeBaseRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseService {
    private final KnowledgeBaseRepository repo;
    public KnowledgeBaseService(KnowledgeBaseRepository repo) { this.repo = repo; }
    public List<KnowledgeBase> findAll() { return repo.findAll(); }
    public Optional<KnowledgeBase> findById(Long id) { return repo.findById(id); }
    public KnowledgeBase save(KnowledgeBase k) { return repo.save(k); }
    public void deleteById(Long id) { repo.deleteById(id); }

    public List<Map<String, Object>> searchMatchingArticles(String title, String description) {
        String queryText = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase().trim();
        if (queryText.isBlank()) {
            return List.of();
        }

        String[] queryWords = queryText.split("[^a-zA-Z0-9]+");
        Set<String> queryWordSet = Arrays.stream(queryWords)
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());

        if (queryWordSet.isEmpty()) {
            return List.of();
        }

        List<KnowledgeBase> articles = repo.findAll();
        List<Map<String, Object>> scoredArticles = new ArrayList<>();

        for (KnowledgeBase kb : articles) {
            if (kb.getActive() != null && !kb.getActive()) continue;

            String combinedArticleText = ((kb.getTitle() != null ? kb.getTitle() : "") + " "
                    + (kb.getSummary() != null ? kb.getSummary() : "") + " "
                    + (kb.getKeywords() != null ? kb.getKeywords() : "") + " "
                    + (kb.getContent() != null ? kb.getContent() : "")).toLowerCase();

            int matches = 0;
            for (String word : queryWordSet) {
                if (combinedArticleText.contains(word)) {
                    matches++;
                    if (kb.getTitle() != null && kb.getTitle().toLowerCase().contains(word)) {
                        matches++;
                    }
                    if (kb.getKeywords() != null && kb.getKeywords().toLowerCase().contains(word)) {
                        matches++;
                    }
                }
            }

            if (matches > 0) {
                double score = Math.min(0.96, 0.45 + ((double) matches / (queryWordSet.size() * 2.0)) * 0.50);
                Map<String, Object> map = new HashMap<>();
                map.put("id", kb.getArticleId());
                map.put("title", kb.getTitle());
                map.put("summary", kb.getSummary() != null ? kb.getSummary() : (kb.getContent() != null && kb.getContent().length() > 150 ? kb.getContent().substring(0, 150) + "..." : kb.getContent()));
                map.put("content", kb.getContent());
                map.put("category", kb.getCategory() != null ? kb.getCategory().getCategoryName() : "General Support");
                map.put("similarity", Math.round(score * 100.0) / 100.0);
                scoredArticles.add(map);
            }
        }

        scoredArticles.sort((a, b) -> Double.compare((Double) b.get("similarity"), (Double) a.get("similarity")));
        return scoredArticles.stream().limit(5).collect(Collectors.toList());
    }
}
