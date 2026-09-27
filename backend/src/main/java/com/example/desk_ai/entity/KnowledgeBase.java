package com.example.desk_ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long articleId;

    private String title;

    private String summary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String keywords;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String attachmentBase64;

    private String attachmentName;

    private String attachmentType;

    private Integer views = 0;

    private Boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name="category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name="created_by")
    private User createdBy;
}