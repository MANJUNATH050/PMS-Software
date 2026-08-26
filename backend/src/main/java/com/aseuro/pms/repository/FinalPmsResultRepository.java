package com.aseuro.pms.repository;

import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.model.FinalPmsResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinalPmsResultRepository extends JpaRepository<FinalPmsResult, Long> {
    Optional<FinalPmsResult> findByAssignment(PmsAssignment assignment);
}
