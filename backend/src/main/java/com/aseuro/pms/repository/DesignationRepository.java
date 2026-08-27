package com.aseuro.pms.repository;

import com.aseuro.pms.entity.Designation;
import com.aseuro.pms.entity.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DesignationRepository extends JpaRepository<Designation, Long> {
    Optional<Designation> findByNameIgnoreCase(String name);
    List<Designation> findByStatus(RecordStatus status);
}
