package com.aseuro.pms.repository;

import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.model.PmsKpi;
import com.aseuro.pms.model.EmployeeKpiRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeKpiRatingRepository extends JpaRepository<EmployeeKpiRating, Long> {
    List<EmployeeKpiRating> findByAssignment(PmsAssignment assignment);
    Optional<EmployeeKpiRating> findByAssignmentAndKpi(PmsAssignment assignment, PmsKpi kpi);
}
