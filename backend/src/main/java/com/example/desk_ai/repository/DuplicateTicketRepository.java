package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.DuplicateTicket;
import java.util.List;

public interface DuplicateTicketRepository extends JpaRepository<DuplicateTicket, Long> {
    List<DuplicateTicket> findByTicket_TicketId(Long ticketId);
    List<DuplicateTicket> findBySimilarTicket_TicketId(Long ticketId);
}
