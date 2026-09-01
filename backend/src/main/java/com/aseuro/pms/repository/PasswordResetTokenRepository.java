package com.aseuro.pms.repository;

import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    List<PasswordResetToken> findByEmployeeAndUsedAtIsNull(Employee employee);
    void deleteByEmployee(Employee employee);
}
