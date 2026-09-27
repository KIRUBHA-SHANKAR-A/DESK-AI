package com.example.desk_ai.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private String phone;

    private String employeeId;

    private String designation;

    private Boolean active = true;

    private LocalDateTime lastLogin;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "branch")
    private String branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    private AccountStatus accountStatus = AccountStatus.PENDING;

    private Boolean approved = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({"approvedBy", "password", "authorities", "accountNonExpired", "accountNonLocked", "credentialsNonExpired"})
    private User approvedBy;

    private LocalDateTime approvedAt;

    // ── UserDetails implementation ──────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null || role.getRoleName() == null) return List.of();
        String r = role.getRoleName().trim().toUpperCase();
        String withPrefix = r.startsWith("ROLE_") ? r : "ROLE_" + r;
        String raw = r.startsWith("ROLE_") ? r.substring(5) : r;
        return List.of(new SimpleGrantedAuthority(withPrefix), new SimpleGrantedAuthority(raw));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired()   { return true; }

    @Override
    public boolean isAccountNonLocked()    { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(active) && (accountStatus == AccountStatus.APPROVED || Boolean.TRUE.equals(approved));
    }
}
