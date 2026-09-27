package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.Attachment;
import java.util.List;
import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    Optional<Attachment> findByTicketTicketId(Long ticketId);
    List<Attachment> findAllByTicketTicketId(Long ticketId);
}
