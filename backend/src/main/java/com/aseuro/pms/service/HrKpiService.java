package com.aseuro.pms.service;

import com.aseuro.pms.dto.CreateKpiMasterRequest;
import com.aseuro.pms.dto.KpiMasterDto;
import com.aseuro.pms.dto.UpdateKpiMasterRequest;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.KpiMaster;
import com.aseuro.pms.repository.KpiMasterRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class HrKpiService {

    private final KpiMasterRepository kpiMasterRepository;
    private final DesignationService designationService;

    public HrKpiService(KpiMasterRepository kpiMasterRepository, DesignationService designationService) {
        this.kpiMasterRepository = kpiMasterRepository;
        this.designationService = designationService;
    }

    @Transactional(readOnly = true)
    public List<String> getAllDesignations() {
        return designationService.getAllDesignations();
    }

    @Transactional(readOnly = true)
    public List<KpiMasterDto> getKpisByDesignation(String designation) {
        return getKpis(designation, "ROLE_KPI");
    }

    @Transactional(readOnly = true)
    public List<KpiMasterDto> getKpis(String designation, String category) {
        List<KpiMaster> list;
        String cat = category != null && category.equalsIgnoreCase("HR_REVIEW_KPI") ? "HR_REVIEW_KPI" : "ROLE_KPI";

        if ("HR_REVIEW_KPI".equals(cat)) {
            list = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
        } else if (designation != null && !designation.trim().isEmpty()) {
            list = kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus(designation.trim(), "ROLE_KPI", "ACTIVE");
            if (list.isEmpty()) {
                // Backward compatibility if category was not set previously
                list = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(designation.trim(), "ACTIVE").stream()
                        .filter(k -> !"HR_REVIEW_KPI".equals(k.getKpiCategory()))
                        .collect(Collectors.toList());
            }
        } else {
            list = kpiMasterRepository.findByKpiCategoryAndStatus("ROLE_KPI", "ACTIVE");
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public KpiMasterDto createKpi(CreateKpiMasterRequest request) {
        String category = request.getKpiCategory() != null && request.getKpiCategory().equalsIgnoreCase("HR_REVIEW_KPI")
                ? "HR_REVIEW_KPI"
                : "ROLE_KPI";

        if ("HR_REVIEW_KPI".equals(category)) {
            List<KpiMaster> existingHrKpis = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
            double currentHrTotal = existingHrKpis.stream().mapToDouble(KpiMaster::getWeightage).sum();
            if (currentHrTotal + request.getWeightage() > 100.0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Total HR Review KPI weightage cannot exceed 100%. (Current: " + currentHrTotal + "%, Attempted: " + (currentHrTotal + request.getWeightage()) + "%)");
            }

            KpiMaster hrKpi = KpiMaster.builder()
                    .designation("ALL")
                    .kpiName(request.getKpiName().trim())
                    .description(request.getDescription() != null ? request.getDescription().trim() : "")
                    .weightage(request.getWeightage())
                    .applicableFor("Both Employee & Manager")
                    .kpiCategory("HR_REVIEW_KPI")
                    .status("ACTIVE")
                    .build();

            KpiMaster saved = kpiMasterRepository.save(hrKpi);
            return mapToDto(saved);
        }

        // ROLE_KPI
        String desig = request.getDesignation() != null ? request.getDesignation().trim() : "";
        if (desig.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Designation is required for Role KPIs.");
        }

        List<KpiMaster> existing = kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus(desig, "ROLE_KPI", "ACTIVE");
        double currentTotal = existing.stream().mapToDouble(KpiMaster::getWeightage).sum();
        if (currentTotal + request.getWeightage() > 100.0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Total KPI weightage cannot exceed 100%. (Current: " + currentTotal + "%, Attempted: " + (currentTotal + request.getWeightage()) + "%)");
        }

        String appFor = request.getApplicableFor() != null && !request.getApplicableFor().trim().isEmpty()
                ? request.getApplicableFor().trim()
                : "Employee";

        KpiMaster kpi = KpiMaster.builder()
                .designation(desig)
                .kpiName(request.getKpiName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .weightage(request.getWeightage())
                .applicableFor(appFor)
                .kpiCategory("ROLE_KPI")
                .status("ACTIVE")
                .build();

        KpiMaster saved = kpiMasterRepository.save(kpi);
        return mapToDto(saved);
    }

    @Transactional
    public KpiMasterDto updateKpi(Long id, UpdateKpiMasterRequest request) {
        KpiMaster kpi = kpiMasterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "KPI not found"));

        if ("HR_REVIEW_KPI".equals(kpi.getKpiCategory())) {
            List<KpiMaster> existingHrKpis = kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE");
            double otherTotal = existingHrKpis.stream()
                    .filter(k -> !k.getId().equals(id))
                    .mapToDouble(KpiMaster::getWeightage)
                    .sum();

            if (otherTotal + request.getWeightage() > 100.0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Total HR Review KPI weightage cannot exceed 100%. (Other KPIs: " + otherTotal + "%, Attempted: " + (otherTotal + request.getWeightage()) + "%)");
            }
        } else {
            List<KpiMaster> existing = kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus(kpi.getDesignation(), "ROLE_KPI", "ACTIVE");
            double otherTotal = existing.stream()
                    .filter(k -> !k.getId().equals(id))
                    .mapToDouble(KpiMaster::getWeightage)
                    .sum();

            if (otherTotal + request.getWeightage() > 100.0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Total KPI weightage cannot exceed 100%. (Other KPIs: " + otherTotal + "%, Attempted: " + (otherTotal + request.getWeightage()) + "%)");
            }
        }

        kpi.setKpiName(request.getKpiName().trim());
        if (request.getDescription() != null) {
            kpi.setDescription(request.getDescription().trim());
        }
        kpi.setWeightage(request.getWeightage());
        if (request.getApplicableFor() != null && !request.getApplicableFor().trim().isEmpty()) {
            kpi.setApplicableFor(request.getApplicableFor().trim());
        }
        if (request.getKpiCategory() != null && !request.getKpiCategory().trim().isEmpty()) {
            kpi.setKpiCategory(request.getKpiCategory().trim());
        }
        if (request.getStatus() != null) {
            kpi.setStatus(request.getStatus().trim());
        }

        KpiMaster updated = kpiMasterRepository.save(kpi);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteKpi(Long id) {
        KpiMaster kpi = kpiMasterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "KPI not found"));
        kpiMasterRepository.delete(kpi);
    }

    private KpiMasterDto mapToDto(KpiMaster k) {
        return KpiMasterDto.builder()
                .id(k.getId())
                .designation(k.getDesignation())
                .kpiName(k.getKpiName())
                .description(k.getDescription())
                .weightage(k.getWeightage())
                .applicableFor(k.getApplicableFor() != null ? k.getApplicableFor() : "Employee")
                .kpiCategory(k.getKpiCategory() != null ? k.getKpiCategory() : "ROLE_KPI")
                .status(k.getStatus())
                .build();
    }
}
