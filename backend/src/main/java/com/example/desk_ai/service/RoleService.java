package com.example.desk_ai.service;

import com.example.desk_ai.entity.Role;
import com.example.desk_ai.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {
    private final RoleRepository repo;
    public RoleService(RoleRepository repo) { this.repo = repo; }
    public List<Role> findAll() { return repo.findAll(); }
    public Optional<Role> findById(Long id) { return repo.findById(id); }
    public Role save(Role r) { return repo.save(r); }
    public void deleteById(Long id) { repo.deleteById(id); }
}
