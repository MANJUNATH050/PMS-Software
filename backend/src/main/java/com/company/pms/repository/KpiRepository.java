package com.company.pms.repository;

import com.company.pms.entity.KpiEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiRepository extends JpaRepository<KpiEntity, Long> {
    List<KpiEntity> findByDesignationId(Long designationId);
}
