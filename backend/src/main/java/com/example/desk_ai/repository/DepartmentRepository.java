package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.Department;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByDepartmentNameContainingIgnoreCase(String name);
    List<Department> findByDepartmentNameIgnoreCase(String name);
}
