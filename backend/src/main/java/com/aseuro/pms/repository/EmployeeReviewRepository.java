package com.aseuro.pms.repository;

import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.model.EmployeeReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeReviewRepository extends JpaRepository<EmployeeReview, Long> {
    List<EmployeeReview> findByAssignment(PmsAssignment assignment);
}
