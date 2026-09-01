package com.aseuro.pms.service;

import com.aseuro.pms.entity.Designation;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.KpiMaster;
import com.aseuro.pms.repository.DesignationRepository;
import com.aseuro.pms.repository.KpiMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DesignationService {

    private final DesignationRepository designationRepository;
    private final KpiMasterRepository kpiMasterRepository;

    public List<String> getAllDesignations() {
        Set<String> set = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        // Always seed default designations
        set.addAll(List.of(
                "Software Engineer",
                "Senior Software Engineer",
                "Tech Lead",
                "Engineering Manager",
                "QA Engineer",
                "HR Director",
                "HR Manager"
        ));

        try {
            List<KpiMaster> kpis = kpiMasterRepository.findAll();
            for (KpiMaster k : kpis) {
                if (k.getDesignation() != null && !k.getDesignation().trim().isEmpty()
                        && !"ALL".equalsIgnoreCase(k.getDesignation().trim())
                        && !"GLOBAL".equalsIgnoreCase(k.getDesignation().trim())) {
                    set.add(k.getDesignation().trim());
                }
            }
        } catch (Exception ignored) {
        }

        try {
            List<Designation> dbList = designationRepository.findAll();
            for (Designation d : dbList) {
                if (d.getName() != null && !d.getName().trim().isEmpty()) {
                    set.add(d.getName().trim());
                }
            }
        } catch (Exception ignored) {
        }

        return new ArrayList<>(set);
    }

    public Designation createDesignation(String name, String description) {
        if (name == null || name.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role / Designation name is required.");
        }

        String trimmedName = name.trim();
        String desc = (description != null && !description.trim().isEmpty()) ? description.trim() : trimmedName + " Role Profile";

        try {
            KpiMaster masterKpi = KpiMaster.builder()
                    .designation(trimmedName)
                    .kpiName(trimmedName + " Core Performance Target")
                    .description(desc)
                    .weightage(75.0)
                    .applicableFor("Both Employee & Manager")
                    .kpiCategory("ROLE_KPI")
                    .status("ACTIVE")
                    .build();
            kpiMasterRepository.save(masterKpi);
        } catch (Exception ignored) {
        }

        Designation result = new Designation(trimmedName, desc);
        result.setId(System.currentTimeMillis() % 10000);
        return result;
    }
}
