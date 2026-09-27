package com.example.desk_ai.service;

import com.example.desk_ai.entity.Department;
import com.example.desk_ai.repository.DepartmentRepository;
import com.example.desk_ai.repository.TicketRepository;
import com.example.desk_ai.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {
    private final DepartmentRepository repo;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    public DepartmentService(DepartmentRepository repo,
                             UserRepository userRepository,
                             TicketRepository ticketRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
    }

    public List<Department> findAll() { return repo.findAll(); }
    public Optional<Department> findById(Long id) { return repo.findById(id); }
    public Department save(Department d) { return repo.save(d); }

    @Transactional
    public void deleteById(Long id) {
        try {
            userRepository.findByDepartment_DepartmentId(id).forEach(u -> {
                u.setDepartment(null);
                userRepository.save(u);
            });
            ticketRepository.findByDepartment_DepartmentId(id).forEach(t -> {
                t.setDepartment(null);
                ticketRepository.save(t);
            });
        } catch (Exception ignored) {}
        repo.deleteById(id);
    }
}
