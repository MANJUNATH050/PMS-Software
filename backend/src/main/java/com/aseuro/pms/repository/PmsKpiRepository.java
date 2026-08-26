package com.aseuro.pms.repository;

import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.model.PmsKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PmsKpiRepository extends JpaRepository<PmsKpi, Long> {
    List<PmsKpi> findByAssignment(PmsAssignment assignment);
}
