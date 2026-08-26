package com.aseuro.pms.repository;

import com.aseuro.pms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmailIgnoreCase(String email);
}
