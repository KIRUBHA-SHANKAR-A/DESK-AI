package com.example.desk_ai.controller;

import com.example.desk_ai.dto.AuthRequest;
import com.example.desk_ai.dto.AuthResponse;
import com.example.desk_ai.dto.OtpVerificationRequest;
import com.example.desk_ai.dto.RegisterRequest;
import com.example.desk_ai.entity.User;
import com.example.desk_ai.service.OtpService;
import com.example.desk_ai.service.UserService;
import com.example.desk_ai.utils.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public AuthController(AuthenticationManager authManager,
                          UserService userService,
                          JwtUtil jwtUtil,
                          OtpService otpService) {
        this.authManager = authManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }


        @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody RegisterRequest request) {
        try {
            // Validate request
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email is required"));
            }

            if (request.getPassword() == null || request.getPassword().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Password is required"));
            }

            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Name is required"));
            }

            // Force role to ADMIN
            request.setRole("ADMIN");

            // Register admin with auto-approval
            User user = userService.registerAdmin(request);

            // Generate token for immediate login
            String token = jwtUtil.generateToken(user);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "message", "Admin registration successful!",
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", user.getRole().getRoleName(),
                        "token", token,
                        "autoApprove", true
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    // ── POST /api/auth/register ──────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Registration successful. Pending admin approval."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email is required."));
            }

            String normalizedEmail = request.getEmail().trim().toLowerCase();
            User user = userService.findByEmail(normalizedEmail)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Invalid Credentials"));
            }

            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
            User authenticatedUser = (User) auth.getPrincipal();
            if (authenticatedUser == null || userService.findByEmail(authenticatedUser.getEmail()).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Invalid Credentials"));
            }

            otpService.sendOtp(authenticatedUser.getEmail());
            return ResponseEntity.ok(Map.of(
                    "message", "OTP sent to your email. Please verify to complete login.",
                    "email", authenticatedUser.getEmail()
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Your account is pending approval or disabled."));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        boolean valid = otpService.verifyOtp(normalizedEmail, request.getOtp());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired OTP"));
        }

        User user = userService.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Invalid Credentials"));
        String token = jwtUtil.generateToken(user);
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "USER";
        Long deptId = user.getDepartment() != null ? user.getDepartment().getDepartmentId() : null;
        String deptName = user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null;
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getName(), roleName, deptId, deptName, user.getDepartment()));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is required"));
        }
        String normalizedEmail = email.trim().toLowerCase();
        boolean sent = otpService.resendOtp(normalizedEmail);
        if (!sent) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to resend OTP"));
        }
        return ResponseEntity.ok(Map.of("message", "OTP resent successfully to " + normalizedEmail));
    }
}
