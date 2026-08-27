package com.company.pms.service;

import com.company.pms.dto.Dtos.*;
import com.company.pms.entity.KpiEntity;
import com.company.pms.repository.KpiRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KpiService {

    private final KpiRepository kpiRepository;

    public KpiService(KpiRepository kpiRepository) {
        this.kpiRepository = kpiRepository;
    }

    public List<KpiResponse> getKpisByDesignation(Long designationId) {
        List<KpiEntity> kpis = designationId != null ? kpiRepository.findByDesignationId(designationId) : kpiRepository.findAll();
        return kpis.stream()
                .map(k -> new KpiResponse(k.getId(), k.getDesignationId(), k.getKpiName(), k.getMeasurementPercent(), k.getSelfRatingDefault(), k.getManagerRatingDefault(), k.getDescription()))
                .toList();
    }

    @Transactional
    public KpiResponse createKpi(KpiCreateRequest req) {
        Long desigId = req.designationId() != null ? req.designationId() : 1L;
        List<KpiEntity> existing = kpiRepository.findByDesignationId(desigId);
        double currentTotal = existing.stream().mapToDouble(KpiEntity::getMeasurementPercent).sum();

        if (currentTotal + req.measurementPercent() > 100.0) {
            throw new IllegalArgumentException("Total KPI measurement weightage for this designation cannot exceed 100%. Current total: " + currentTotal + "%, Attempted to add: " + req.measurementPercent() + "%");
        }

        KpiEntity entity = new KpiEntity();
        entity.setDesignationId(desigId);
        entity.setKpiName(req.kpiName());
        entity.setMeasurementPercent(req.measurementPercent());
        entity.setSelfRatingDefault(req.selfRatingDefault() != null ? req.selfRatingDefault() : 5.0);
        entity.setManagerRatingDefault(req.managerRatingDefault() != null ? req.managerRatingDefault() : 4.0);
        entity.setDescription(req.description());

        KpiEntity saved = kpiRepository.save(entity);
        return new KpiResponse(saved.getId(), saved.getDesignationId(), saved.getKpiName(), saved.getMeasurementPercent(), saved.getSelfRatingDefault(), saved.getManagerRatingDefault(), saved.getDescription());
    }

    @Transactional
    public KpiResponse updateKpi(Long id, KpiCreateRequest req) {
        KpiEntity entity = kpiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("KPI not found with ID: " + id));

        Long desigId = entity.getDesignationId();
        List<KpiEntity> existing = kpiRepository.findByDesignationId(desigId);
        double currentTotalWithoutThis = existing.stream()
                .filter(k -> !k.getId().equals(id))
                .mapToDouble(KpiEntity::getMeasurementPercent)
                .sum();

        if (currentTotalWithoutThis + req.measurementPercent() > 100.0) {
            throw new IllegalArgumentException("Total KPI measurement weightage cannot exceed 100%. Max allowed for this KPI: " + (100.0 - currentTotalWithoutThis) + "%");
        }

        entity.setKpiName(req.kpiName());
        entity.setMeasurementPercent(req.measurementPercent());
        if (req.selfRatingDefault() != null) entity.setSelfRatingDefault(req.selfRatingDefault());
        if (req.managerRatingDefault() != null) entity.setManagerRatingDefault(req.managerRatingDefault());
        if (req.description() != null) entity.setDescription(req.description());

        KpiEntity updated = kpiRepository.save(entity);
        return new KpiResponse(updated.getId(), updated.getDesignationId(), updated.getKpiName(), updated.getMeasurementPercent(), updated.getSelfRatingDefault(), updated.getManagerRatingDefault(), updated.getDescription());
    }

    @Transactional
    public void deleteKpi(Long id) {
        kpiRepository.deleteById(id);
    }
}
