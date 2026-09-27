package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.KnowledgeBase;

import java.util.List;

public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    List<KnowledgeBase> findByCategory_CategoryId(Long categoryId);
}
