package com.aseuro.pms.repository;

import com.aseuro.pms.entity.Department;
import com.aseuro.pms.entity.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByNameIgnoreCase(String name);
    List<Department> findByStatus(RecordStatus status);
}
