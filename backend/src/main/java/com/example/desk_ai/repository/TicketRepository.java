package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.Ticket;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findAllByOrderByCreatedAtDesc();
    List<Ticket> findByCreatedBy_UserIdOrderByCreatedAtDesc(Long userId);
    List<Ticket> findByAssignedTo_UserIdOrderByCreatedAtDesc(Long userId);
    List<Ticket> findByDepartment_DepartmentIdOrderByCreatedAtDesc(Long departmentId);
    List<Ticket> findByAssignedTo_UserIdOrDepartment_DepartmentIdOrderByCreatedAtDesc(Long userId, Long departmentId);
    List<Ticket> findByStatusNotOrderByCreatedAtDesc(String status);
    List<Ticket> findByCategory_CategoryIdOrderByCreatedAtDesc(Long categoryId);

    List<Ticket> findByCreatedBy_UserId(Long userId);
    List<Ticket> findByAssignedTo_UserId(Long userId);
    List<Ticket> findByDepartment_DepartmentId(Long departmentId);
    List<Ticket> findByAssignedTo_UserIdOrDepartment_DepartmentId(Long userId, Long departmentId);
    List<Ticket> findByStatusNot(String status);
    List<Ticket> findByCategory_CategoryId(Long categoryId);
}
