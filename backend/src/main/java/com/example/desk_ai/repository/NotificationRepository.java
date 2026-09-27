package com.example.desk_ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.desk_ai.entity.Notification;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}

