package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.SLA;

import java.util.List;

public interface SLARepository extends JpaRepository<SLA, Long> {
    List<SLA> findByTicket_TicketId(Long ticketId);
}
