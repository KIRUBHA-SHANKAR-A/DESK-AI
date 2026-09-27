package com.example.desk_ai.service;

import com.example.desk_ai.dto.RegisterRequest;
import com.example.desk_ai.dto.UserDTO;
import com.example.desk_ai.entity.Department;
import com.example.desk_ai.entity.Role;
import com.example.desk_ai.entity.User;
import com.example.desk_ai.repository.DepartmentRepository;
import com.example.desk_ai.repository.RoleRepository;
import com.example.desk_ai.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.desk_ai.entity.AccountStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.example.desk_ai.repository.TicketRepository ticketRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder,
                       @org.springframework.context.annotation.Lazy com.example.desk_ai.repository.TicketRepository ticketRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.ticketRepository = ticketRepository;
    }

    // ── UserDetailsService ───────────────────────────────────────────────────

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    // ── Registration ─────────────────────────────────────────────────────────

    public User registerUser(RegisterRequest req) {
        if (req == null) {
            throw new RuntimeException("Registration request cannot be empty.");
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new RuntimeException("Email is required.");
        }
        if (req.getPassword() == null || req.getPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long.");
        }
        if (req.getPhone() == null || !Pattern.compile("^\\+?[0-9]{10,15}$").matcher(req.getPhone()).matches()) {
            throw new RuntimeException("Phone number must be 10-15 digits and may start with +.");
        }
        if (userRepository.existsByPhone(req.getPhone().trim())) {
            throw new RuntimeException("Phone number already registered: " + req.getPhone());
        }
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("Email already registered: " + req.getEmail());
        }
        if (req.getEmployeeId() != null && !req.getEmployeeId().isBlank() && userRepository.existsByEmployeeId(req.getEmployeeId().trim())) {
            throw new RuntimeException("Employee ID already registered: " + req.getEmployeeId());
        }

        String normalizedRole = (req.getRole() == null ? "EMPLOYEE" : req.getRole().trim().toUpperCase());
        if (!"EMPLOYEE".equals(normalizedRole) && !"SUPPORT_ENGINEER".equals(normalizedRole)) {
            throw new RuntimeException("Role must be EMPLOYEE or SUPPORT_ENGINEER.");
        }

        Role chosenRole = roleRepository.findByRoleName(normalizedRole)
                .orElseGet(() -> roleRepository.save(new Role(null, normalizedRole, normalizedRole.replace('_', ' '), "READ")));

        Department dept = null;
        if ("SUPPORT_ENGINEER".equals(normalizedRole) && req.getDepartmentId() != null) {
            dept = departmentRepository.findById(req.getDepartmentId()).orElseThrow(() -> new RuntimeException("Department not found."));
        }
        if ("SUPPORT_ENGINEER".equals(normalizedRole) && req.getDepartmentId() == null) {
            throw new RuntimeException("Department is required for support engineers.");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone().trim());
        user.setEmployeeId(req.getEmployeeId() != null ? req.getEmployeeId().trim() : null);
        user.setDesignation(req.getDesignation());
        user.setActive(true);
        user.setRole(chosenRole);
        user.setDepartment(dept);
        user.setBranch(req.getBranch());
        user.setAccountStatus(AccountStatus.PENDING);
        user.setApproved(true);
        user.setApprovedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // ── Admin Approvals ──────────────────────────────────────────────────────

    @Transactional
public User registerAdmin(RegisterRequest request) {
    // Check if admin already exists
    if (userRepository.existsByRole_RoleName("ADMIN")) {
        throw new RuntimeException("An admin already exists. Only one admin can be registered.");
    }

    // Validate email uniqueness
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
        throw new RuntimeException("Email already registered");
    }

    // Validate employee ID uniqueness
    if (userRepository.findByEmployeeId(request.getEmployeeId()).isPresent()) {
        throw new RuntimeException("Employee ID already exists");
    }

    Role adminRole = roleRepository.findByRoleName("ADMIN")
            .orElseThrow(() -> new RuntimeException("ADMIN role not found. Please create roles first."));

    Department department = null;
    if (request.getDepartmentId() != null) {
        department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
    }

    User user = new User();
    user.setName(request.getName());
    user.setEmail(request.getEmail().toLowerCase());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setPhone(request.getPhone());
    user.setEmployeeId(request.getEmployeeId());
    user.setDesignation(request.getDesignation());
    user.setRole(adminRole);
    user.setDepartment(department);
    user.setActive(true); // Auto-approved
    user.setApproved(true);

    return userRepository.save(user);
}

    public List<UserDTO> getPendingUsers() {
        try {
            return userRepository.findAll().stream()
                    .filter(u -> (u.getAccountStatus() == AccountStatus.PENDING) || (Boolean.FALSE.equals(u.getApproved()) && u.getAccountStatus() != AccountStatus.REJECTED))
                    .map(this::toDTO)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching pending users: {}", e.getMessage());
            return List.of();
        }
    }

    public void approveUser(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setAccountStatus(AccountStatus.APPROVED);
            user.setApproved(true);
            user.setApprovedAt(LocalDateTime.now());
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof User) {
                    user.setApprovedBy((User) auth.getPrincipal());
                }
            } catch (Exception ignored) {}
            userRepository.save(user);
        });
    }

    public void rejectUser(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setAccountStatus(AccountStatus.REJECTED);
            user.setApproved(false);
            userRepository.save(user);
        });
    }

    // ── CRUD helpers ─────────────────────────────────────────────────────────

    public List<UserDTO> findAll() {
        try {
            return userRepository.findAll().stream()
                    .map(this::toDTO)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all users: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<UserDTO> findById(Long id) {
        return userRepository.findById(id).map(this::toDTO);
    }

    public Optional<User> findRawById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User updateProfile(String email, String newName, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
        }
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword.trim()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public UserDTO createUserByAdmin(java.util.Map<String, Object> req) {
        String email = req.get("email") != null ? req.get("email").toString().trim().toLowerCase() : null;
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered: " + email);
        }

        String name = req.get("name") != null ? req.get("name").toString().trim() : "New User";
        String password = req.get("password") != null && !req.get("password").toString().isBlank()
                ? req.get("password").toString().trim()
                : "password";

        String empId = req.get("employeeId") != null && !req.get("employeeId").toString().isBlank()
                ? req.get("employeeId").toString().trim()
                : null;
        if (empId != null && userRepository.existsByEmployeeId(empId)) {
            throw new RuntimeException("Employee ID already registered: " + empId);
        }

        String roleStr = req.get("roleName") != null ? req.get("roleName").toString()
                : (req.get("role") != null ? req.get("role").toString() : "EMPLOYEE");
        String normalizedRole = roleStr.toUpperCase().replace("ROLE_", "").trim();
        Role chosenRole = roleRepository.findByRoleName(normalizedRole)
                .orElseGet(() -> roleRepository.save(new Role(null, normalizedRole, normalizedRole.replace('_', ' '), "READ")));

        Department dept = null;
        if (req.get("departmentId") != null && !req.get("departmentId").toString().isBlank()) {
            try {
                Long dId = Long.valueOf(req.get("departmentId").toString());
                dept = departmentRepository.findById(dId).orElse(null);
            } catch (Exception ignored) {}
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmployeeId(empId);
        if (req.get("phone") != null) user.setPhone(req.get("phone").toString().trim());
        if (req.get("designation") != null) user.setDesignation(req.get("designation").toString());
        if (req.get("branch") != null) user.setBranch(req.get("branch").toString());

        boolean active = req.get("active") != null ? Boolean.parseBoolean(req.get("active").toString()) : true;
        user.setActive(active);
        user.setRole(chosenRole);
        user.setDepartment(dept);
        user.setAccountStatus(AccountStatus.APPROVED);
        user.setApproved(true);
        user.setApprovedAt(LocalDateTime.now());

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUserByAdmin(Long id, java.util.Map<String, Object> req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (req.containsKey("name") && req.get("name") != null) {
            user.setName(req.get("name").toString().trim());
        }

        if (req.containsKey("email") && req.get("email") != null) {
            String newEmail = req.get("email").toString().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new RuntimeException("Email already in use: " + newEmail);
                }
                user.setEmail(newEmail);
            }
        }

        if (req.containsKey("employeeId")) {
            Object empIdObj = req.get("employeeId");
            String newEmpId = empIdObj != null ? empIdObj.toString().trim() : "";
            if (!newEmpId.equals(user.getEmployeeId() != null ? user.getEmployeeId() : "")) {
                if (!newEmpId.isBlank() && userRepository.existsByEmployeeId(newEmpId)) {
                    throw new RuntimeException("Employee ID already in use: " + newEmpId);
                }
                user.setEmployeeId(newEmpId.isBlank() ? null : newEmpId);
            }
        }

        if (req.containsKey("phone")) {
            user.setPhone(req.get("phone") != null ? req.get("phone").toString().trim() : null);
        }

        if (req.containsKey("designation")) {
            user.setDesignation(req.get("designation") != null ? req.get("designation").toString() : null);
        }

        if (req.containsKey("branch")) {
            user.setBranch(req.get("branch") != null ? req.get("branch").toString() : null);
        }

        if (req.containsKey("active") && req.get("active") != null) {
            user.setActive(Boolean.parseBoolean(req.get("active").toString()));
        }

        if (req.containsKey("password") && req.get("password") != null && !req.get("password").toString().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.get("password").toString().trim()));
        }

        if (req.containsKey("roleName") || req.containsKey("role")) {
            Object rObj = req.get("roleName") != null ? req.get("roleName") : req.get("role");
            if (rObj != null && !rObj.toString().isBlank()) {
                String normalizedRole = rObj.toString().toUpperCase().replace("ROLE_", "").trim();
                Role chosenRole = roleRepository.findByRoleName(normalizedRole)
                        .orElseGet(() -> roleRepository.save(new Role(null, normalizedRole, normalizedRole.replace('_', ' '), "READ")));
                user.setRole(chosenRole);
            }
        }

        if (req.containsKey("departmentId")) {
            Object dIdObj = req.get("departmentId");
            if (dIdObj == null || dIdObj.toString().isBlank() || "0".equals(dIdObj.toString())) {
                user.setDepartment(null);
            } else {
                try {
                    Long dId = Long.valueOf(dIdObj.toString());
                    user.setDepartment(departmentRepository.findById(dId).orElse(null));
                } catch (Exception ignored) {
                    user.setDepartment(null);
                }
            }
        }

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteById(Long id) {
        try {
            ticketRepository.findByCreatedBy_UserId(id).forEach(t -> {
                t.setCreatedBy(null);
                ticketRepository.save(t);
            });
            ticketRepository.findByAssignedTo_UserId(id).forEach(t -> {
                t.setAssignedTo(null);
                ticketRepository.save(t);
            });
        } catch (Exception ignored) {}
        userRepository.deleteById(id);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    public UserDTO toDTO(User user) {
        if (user == null) return null;
        Long deptId = user.getDepartment() != null ? user.getDepartment().getDepartmentId() : null;
        String deptName = user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null;
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "EMPLOYEE";
        return new UserDTO(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getEmployeeId(),
                user.getDesignation(),
                user.getActive() != null ? user.getActive() : true,
                roleName,
                deptId,
                deptName,
                user.getDepartment()
        );
    }
}
