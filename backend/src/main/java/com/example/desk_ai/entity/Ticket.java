package com.example.desk_ai.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;
    private String ticketNumber;

    private String title;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String priority;

    private String status;

    private String aiCategory;

    private Double aiConfidenceScore;

    private Double duplicateScore;

    private String tags;

    private Long mergedIntoTicketId;

    private String sourceChannel = "PORTAL";

    private String resolution;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String solutionAttachmentBase64;

    private String solutionAttachmentName;

    private LocalDateTime assignedAt;

    private LocalDateTime startedAt;

    private LocalDateTime solvedAt;

    private LocalDateTime closedAt;

    private LocalDateTime resolvedAt;

    private LocalDateTime dueDate;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name="user_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name="assigned_to")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name="solved_by_id")
    private User solvedBy;

    @ManyToOne
    @JoinColumn(name="closed_by_id")
    private User closedBy;

    @ManyToOne
    @JoinColumn(name="category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name="department_id")
    private Department department;

    public Long getAssignedEngineerId() {
        return assignedTo != null ? assignedTo.getUserId() : null;
    }

    public Long getAssignedTeamId() {
        return department != null ? department.getDepartmentId() : null;
    }
}