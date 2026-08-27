package com.company.pms.repository;

import com.company.pms.entity.Employee;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Employee> findByEmployeeCodeIgnoreCase(String code);

    Optional<Employee> findByEmailIgnoreCase(String email);

    long countByStatus(com.company.pms.entity.RecordStatus status);
}
