package com.example.desk_ai.controller;

import com.example.desk_ai.dto.UserDTO;
import com.example.desk_ai.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserDTO> all() {
        return userService.findAll();
    }

    @GetMapping("/pending")
    public List<UserDTO> getPendingUsers() {
        return userService.getPendingUsers();
    }

    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<String> approveUser(@PathVariable Long id) {
        userService.approveUser(id);
        return ResponseEntity.ok("User approved successfully");
    }

    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.DELETE, RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<String> rejectUser(@PathVariable Long id) {
        userService.rejectUser(id);
        return ResponseEntity.ok("User rejected successfully");
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserDTO> getByEmail(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return userService.findByEmail(email.trim().toLowerCase())
                .map(userService::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-email/{email}")
    public ResponseEntity<UserDTO> getByEmailPath(@PathVariable String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return userService.findByEmail(email.trim().toLowerCase())
                .map(userService::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/department-by-email")
    public ResponseEntity<?> getDepartmentByEmail(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is required"));
        }
        return userService.findByEmail(email.trim().toLowerCase())
                .map(user -> {
                    com.example.desk_ai.entity.Department dept = user.getDepartment();
                    if (dept != null) {
                        return ResponseEntity.ok(java.util.Map.of(
                                "email", user.getEmail(),
                                "departmentId", dept.getDepartmentId(),
                                "departmentName", dept.getDepartmentName(),
                                "department", dept
                        ));
                    } else {
                        return ResponseEntity.ok(java.util.Map.of(
                                "email", user.getEmail(),
                                "departmentId", 1L,
                                "departmentName", "IT Support",
                                "message", "Default department applied"
                        ));
                    }
                })
                .orElse(ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                        .body(java.util.Map.of("error", "User not found with email: " + email)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> get(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivate(@PathVariable Long id) {
        return userService.findRawById(id).map(user -> {
            user.setActive(false);
            userService.save(user);
            return ResponseEntity.ok("User deactivated");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<String> activate(@PathVariable Long id) {
        return userService.findRawById(id).map(user -> {
            user.setActive(true);
            userService.save(user);
            return ResponseEntity.ok("User activated");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(
            @RequestBody java.util.Map<String, String> payload,
            org.springframework.security.core.Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        if ((email == null || email.isBlank()) && payload.containsKey("email")) {
            email = payload.get("email");
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        com.example.desk_ai.entity.User updated = userService.updateProfile(
                email.trim().toLowerCase(),
                payload.get("name"),
                payload.get("password") != null ? payload.get("password") : payload.get("newPassword")
        );
        return ResponseEntity.ok(userService.toDTO(updated));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody java.util.Map<String, Object> payload) {
        try {
            UserDTO created = userService.createUserByAdmin(payload);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to create user"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        try {
            UserDTO updated = userService.updateUserByAdmin(id, payload);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to update user"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
