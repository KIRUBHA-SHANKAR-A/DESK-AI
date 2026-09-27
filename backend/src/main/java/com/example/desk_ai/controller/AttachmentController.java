package com.example.desk_ai.controller;

import com.example.desk_ai.entity.Attachment;
import com.example.desk_ai.entity.Ticket;
import com.example.desk_ai.repository.TicketRepository;
import com.example.desk_ai.service.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService service;
    private final TicketRepository ticketRepository;

    public AttachmentController(AttachmentService service, TicketRepository ticketRepository) {
        this.service = service;
        this.ticketRepository = ticketRepository;
    }

    @GetMapping
    public List<Attachment> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attachment> get(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ticket/{ticketId}")
    public List<Attachment> getByTicket(@PathVariable Long ticketId) {
        return service.findByTicketId(ticketId);
    }

    @PostMapping
    public Attachment create(@RequestBody Attachment a) {
        return service.save(a);
    }

    // Convert uploaded MultipartFile directly to Base64 data string and save in backend
    @PostMapping("/upload")
    public ResponseEntity<Attachment> uploadAttachment(
            @RequestParam("ticketId") Long ticketId,
            @RequestParam("file") MultipartFile file) throws IOException {

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String contentType = file.getContentType() != null ? file.getContentType() : "image/png";
        String base64DataUrl = "data:" + contentType + ";base64," + base64;

        Attachment attachment = new Attachment();
        attachment.setImageName(file.getOriginalFilename());
        attachment.setImageType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setBase64Data(base64DataUrl);
        attachment.setImagePath(file.getOriginalFilename());
        attachment.setTicket(ticketOpt.get());

        Attachment saved = service.save(attachment);
        return ResponseEntity.ok(saved);
    }

    // Direct Base64 JSON upload endpoint
    @PostMapping("/base64")
    public ResponseEntity<Attachment> uploadBase64(@RequestBody Map<String, Object> body) {
        Long ticketId = Long.valueOf(body.get("ticketId").toString());
        String base64Data = (String) body.get("base64Data");
        String imageName = (String) body.getOrDefault("imageName", "screenshot.png");
        String imageType = (String) body.getOrDefault("imageType", "image/png");

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Attachment attachment = new Attachment();
        attachment.setImageName(imageName);
        attachment.setImageType(imageType);
        attachment.setBase64Data(base64Data);
        attachment.setImagePath(imageName);
        attachment.setTicket(ticketOpt.get());

        Attachment saved = service.save(attachment);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attachment> update(@PathVariable Long id, @RequestBody Attachment a) {
        a.setAttachmentId(id);
        return ResponseEntity.ok(service.save(a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Module 4: Download Attachment ───────────────────────────────────────────
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        return service.findById(id).map(attachment -> {
            try {
                String raw = attachment.getBase64Data();
                if (raw == null) {
                    return ResponseEntity.notFound().<byte[]>build();
                }
                String pureBase64 = raw.contains(",") ? raw.split(",")[1] : raw;
                byte[] data = Base64.getDecoder().decode(pureBase64);

                String filename = attachment.getImageName() != null ? attachment.getImageName() : "attachment_" + id + ".png";
                String contentType = attachment.getImageType() != null ? attachment.getImageType() : "application/octet-stream";

                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .body(data);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().<byte[]>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
