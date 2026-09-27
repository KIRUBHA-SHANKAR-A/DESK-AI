package com.example.desk_ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attachmentId;

    private String imageName;

    private String imageType;

    private Long fileSize;

    private String imagePath;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String base64Data;

    private LocalDateTime uploadedAt = LocalDateTime.now();

    @OneToOne
    @JoinColumn(name="ticket_id")
    private Ticket ticket;
}