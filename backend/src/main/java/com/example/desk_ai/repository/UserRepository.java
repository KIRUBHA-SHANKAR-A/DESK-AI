package com.example.desk_ai.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.User;

import com.example.desk_ai.entity.AccountStatus;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    List<User> findByAccountStatus(AccountStatus accountStatus);
    boolean existsByPhone(String trim);
    Optional<User> findByEmployeeId(String employeeId);
    boolean existsByRole_RoleName(String string);
    List<User> findByDepartment_DepartmentIdAndRole_RoleNameAndActiveTrue(Long departmentId, String roleName);
    List<User> findByRole_RoleNameAndActiveTrue(String roleName);
    List<User> findByDepartment_DepartmentId(Long departmentId);
}
