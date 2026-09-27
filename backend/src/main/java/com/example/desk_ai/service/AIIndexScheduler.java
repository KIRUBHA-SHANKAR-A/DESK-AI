package com.example.desk_ai.service;

import com.example.desk_ai.entity.KnowledgeBase;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.repository.KnowledgeBaseRepository;
import com.example.desk_ai.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AIIndexScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AIIndexScheduler.class);

    private final TicketRepository ticketRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final AIService aiService;

    public AIIndexScheduler(TicketRepository ticketRepository,
                            KnowledgeBaseRepository knowledgeBaseRepository,
                            AIService aiService) {
        this.ticketRepository = ticketRepository;
        this.knowledgeBaseRepository = knowledgeBaseRepository;
        this.aiService = aiService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void synchronizeFAISSIndexesOnStartup() {
        logger.info("Initializing FAISS Vector Search Indexes for Tickets and Knowledge Base...");
        try {
            // 1. Index Tickets
            List<Ticket> tickets = ticketRepository.findAll();
            List<Map<String, Object>> ticketIndexItems = tickets.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getTicketId());
                map.put("title", t.getTitle() != null ? t.getTitle() : "");
                map.put("description", t.getDescription() != null ? t.getDescription() : "");
                map.put("status", t.getStatus() != null ? t.getStatus() : "");
                map.put("resolution", t.getResolution() != null ? t.getResolution() : "");
                return map;
            }).collect(Collectors.toList());

            if (!ticketIndexItems.isEmpty()) {
                Map<String, Object> ticketRes = aiService.indexTickets(ticketIndexItems);
                logger.info("Ticket FAISS index sync response: {}", ticketRes);
            }

            // 2. Index Knowledge Base
            List<KnowledgeBase> articles = knowledgeBaseRepository.findAll();
            List<Map<String, Object>> kbIndexItems = articles.stream().map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getArticleId());
                map.put("title", a.getTitle() != null ? a.getTitle() : "");
                map.put("summary", a.getSummary() != null ? a.getSummary() : "");
                map.put("content", a.getContent() != null ? a.getContent() : "");
                return map;
            }).collect(Collectors.toList());

            if (!kbIndexItems.isEmpty()) {
                Map<String, Object> kbRes = aiService.indexKbArticles(kbIndexItems);
                logger.info("KB Article FAISS index sync response: {}", kbRes);
            }

        } catch (Exception e) {
            logger.warn("FAISS Index synchronization failed (AI Service might be starting up): {}", e.getMessage());
        }
    }
}
