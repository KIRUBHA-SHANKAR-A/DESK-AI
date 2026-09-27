package com.example.desk_ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SLA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long slaId;

    private Integer expectedResolutionHours;

    private LocalDateTime deadline;

    private LocalDateTime resolvedAt;

    private Boolean breached = false;

    @OneToOne
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;
}