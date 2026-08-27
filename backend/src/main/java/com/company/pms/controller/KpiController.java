package com.company.pms.controller;

import com.company.pms.dto.Dtos.*;
import com.company.pms.service.KpiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/kpis")
public class KpiController {

    private final KpiService kpiService;

    public KpiController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @GetMapping
    public ResponseEntity<List<KpiResponse>> getKpis(@RequestParam(required = false) Long designationId) {
        return ResponseEntity.ok(kpiService.getKpisByDesignation(designationId));
    }

    @PostMapping
    public ResponseEntity<?> createKpi(@Valid @RequestBody KpiCreateRequest req) {
        try {
            KpiResponse response = kpiService.createKpi(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateKpi(@PathVariable Long id, @Valid @RequestBody KpiCreateRequest req) {
        try {
            KpiResponse response = kpiService.updateKpi(id, req);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKpi(@PathVariable Long id) {
        kpiService.deleteKpi(id);
        return ResponseEntity.noContent().build();
    }
}
