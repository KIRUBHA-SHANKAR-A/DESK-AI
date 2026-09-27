package com.example.desk_ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIService.class);

    private final WebClient webClient;
    private final String aiServiceUrl;

    public AIService(WebClient.Builder webClientBuilder, @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
        this.webClient = webClientBuilder.baseUrl(aiServiceUrl).build();
    }

    public Map<String, Object> classifyTicket(String title, String description) {
        Map<String, String> request = Map.of(
            "title", title != null ? title : "",
            "description", description != null ? description : ""
        );
        try {
            return webClient.post()
                    .uri("/classify")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("category", "IT Support", "confidence", 0.50))
                    .block();
        } catch (Exception e) {
            logger.warn("AI Classification service unavailable, falling back to manual: {}", e.getMessage());
            return Map.of("category", "IT Support", "confidence", 0.50);
        }
    }

    public List<Map<String, Object>> checkDuplicates(String title, String description) {
        Map<String, String> request = Map.of(
            "title", title != null ? title : "",
            "description", description != null ? description : ""
        );
        try {
            return webClient.post()
                    .uri("/duplicate-check")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .collectList()
                    .onErrorReturn(List.of())
                    .block();
        } catch (Exception e) {
            logger.warn("AI Duplicate Check service unavailable: {}", e.getMessage());
            return List.of();
        }
    }

    public List<Map<String, Object>> recommendKB(String title, String description) {
        Map<String, String> request = Map.of(
            "title", title != null ? title : "",
            "description", description != null ? description : ""
        );
        try {
            return webClient.post()
                    .uri("/recommend-kb")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .collectList()
                    .onErrorReturn(List.of())
                    .block();
        } catch (Exception e) {
            logger.warn("AI KB Recommendation service unavailable: {}", e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> predictPriority(String title, String description) {
        Map<String, String> request = Map.of(
            "title", title != null ? title : "",
            "description", description != null ? description : ""
        );
        try {
            return webClient.post()
                    .uri("/predict-priority")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("priority", "MEDIUM", "confidence", 0.50))
                    .block();
        } catch (Exception e) {
            logger.warn("AI Priority Prediction service unavailable: {}", e.getMessage());
            return Map.of("priority", "MEDIUM", "confidence", 0.50);
        }
    }

    public Map<String, Object> indexTickets(List<Map<String, Object>> tickets) {
        Map<String, Object> request = Map.of("tickets", tickets);
        try {
            return webClient.post()
                    .uri("/index-tickets")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("status", "error", "indexed", 0))
                    .block();
        } catch (Exception e) {
            logger.warn("AI Ticket indexing failed: {}", e.getMessage());
            return Map.of("status", "error", "indexed", 0);
        }
    }

    public Map<String, Object> indexKbArticles(List<Map<String, Object>> articles) {
        Map<String, Object> request = Map.of("articles", articles);
        try {
            return webClient.post()
                    .uri("/index-kb")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("status", "error", "indexed", 0))
                    .block();
        } catch (Exception e) {
            logger.warn("AI KB Article indexing failed: {}", e.getMessage());
            return Map.of("status", "error", "indexed", 0);
        }
    }

    // ── Module 6: SLA Breach Prediction ─────────────────────────────────────────
    public Map<String, Object> predictSlaBreach(List<Map<String, Object>> tickets) {
        Map<String, Object> request = Map.of("tickets", tickets);
        try {
            return webClient.post()
                    .uri("/predict-sla-breach")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("status", "error", "predictions", List.of()))
                    .block();
        } catch (Exception e) {
            logger.warn("AI SLA Breach Prediction service unavailable: {}", e.getMessage());
            return Map.of("status", "error", "predictions", List.of());
        }
    }

    // ── Module 7: Auto Knowledge Base Generation ─────────────────────────────────
    public Map<String, Object> generateKbArticles(List<Map<String, Object>> resolvedTickets, int minClusterSize) {
        Map<String, Object> request = Map.of(
            "tickets", resolvedTickets,
            "min_cluster_size", minClusterSize > 0 ? minClusterSize : 2
        );
        try {
            return webClient.post()
                    .uri("/generate-kb")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("status", "error", "articles", List.of()))
                    .block();
        } catch (Exception e) {
            logger.warn("Auto KB Generation service unavailable: {}", e.getMessage());
            return Map.of("status", "error", "articles", List.of());
        }
    }

    // ── Module 8: Multi-Channel Unified Ticket Ingestion ────────────────────────
    public Map<String, Object> ingestMessages(List<Map<String, Object>> messages) {
        Map<String, Object> request = Map.of("messages", messages);
        try {
            return webClient.post()
                    .uri("/ingest")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .onErrorReturn(Map.of("status", "error", "tickets", List.of()))
                    .block();
        } catch (Exception e) {
            logger.warn("Multi-Channel Ingestion service unavailable: {}", e.getMessage());
            return Map.of("status", "error", "tickets", List.of());
        }
    }

    // ── Module 6: Auto Tagging Engine ───────────────────────────────────────────
    public String generateAutoTags(String title, String description, String category, String screenshotName) {
        Set<String> tags = new LinkedHashSet<>();
        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        // Technical domain tags
        if (text.contains("wifi") || text.contains("wi-fi") || text.contains("wireless")) tags.add("WiFi");
        if (text.contains("vpn") || text.contains("tunnel") || text.contains("remote access")) tags.add("VPN");
        if (text.contains("network") || text.contains("lan") || text.contains("ethernet") || text.contains("dns")) tags.add("Network");
        if (text.contains("password") || text.contains("reset") || text.contains("login") || text.contains("auth") || text.contains("sso")) tags.add("Auth");
        if (text.contains("laptop") || text.contains("screen") || text.contains("monitor") || text.contains("display")) tags.add("Hardware");
        if (text.contains("keyboard") || text.contains("mouse") || text.contains("printer")) tags.add("Peripheral");
        if (text.contains("email") || text.contains("outlook") || text.contains("inbox") || text.contains("exchange")) tags.add("Email");
        if (text.contains("database") || text.contains("sql") || text.contains("postgres") || text.contains("mysql")) tags.add("Database");
        if (text.contains("server") || text.contains("linux") || text.contains("docker") || text.contains("cloud")) tags.add("Server");
        if (text.contains("security") || text.contains("phishing") || text.contains("malware") || text.contains("virus")) tags.add("Security");
        if (text.contains("crash") || text.contains("error") || text.contains("freeze") || text.contains("bug")) tags.add("SoftwareBug");
        if (text.contains("license") || text.contains("subscription") || text.contains("activate")) tags.add("License");

        // Screenshot analysis tag
        if (screenshotName != null && !screenshotName.isBlank()) {
            tags.add("ScreenshotAttached");
            String lowerName = screenshotName.toLowerCase();
            if (lowerName.contains("error") || lowerName.contains("fail") || lowerName.contains("alert")) {
                tags.add("VisualError");
            }
        }

        // Category fallback tag
        if (category != null && !category.isBlank()) {
            tags.add(category.replace(" ", ""));
        }

        if (tags.isEmpty()) {
            tags.add("GeneralIssue");
        }

        return String.join(", ", tags);
    }
}