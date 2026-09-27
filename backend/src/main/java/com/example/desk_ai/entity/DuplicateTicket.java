package com.example.desk_ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long duplicateId;

    private Double similarityScore;

    private LocalDateTime detectedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "similar_ticket_id")
    private Ticket similarTicket;
}