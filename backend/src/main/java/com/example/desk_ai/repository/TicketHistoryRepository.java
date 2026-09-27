package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.TicketHistory;

import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicket_TicketId(Long ticketId);
}
