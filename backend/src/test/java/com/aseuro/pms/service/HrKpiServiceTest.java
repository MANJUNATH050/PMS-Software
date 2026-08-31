package com.aseuro.pms.service;

import com.aseuro.pms.dto.CreateKpiMasterRequest;
import com.aseuro.pms.dto.KpiMasterDto;
import com.aseuro.pms.dto.UpdateKpiMasterRequest;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.KpiMaster;
import com.aseuro.pms.repository.KpiMasterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HrKpiServiceTest {

    @Mock
    private KpiMasterRepository kpiMasterRepository;

    @InjectMocks
    private HrKpiService hrKpiService;

    private KpiMaster kpi1;
    private KpiMaster kpi2;

    @BeforeEach
    void setUp() {
        kpi1 = KpiMaster.builder()
                .id(1L)
                .designation("HR Director")
                .kpiName("Recruitment & Talent Acquisition")
                .description("Staffing roadmap")
                .weightage(60.0)
                .kpiCategory("ROLE_KPI")
                .status("ACTIVE")
                .build();

        kpi2 = KpiMaster.builder()
                .id(2L)
                .designation("HR Director")
                .kpiName("Employee Engagement")
                .description("Pulse surveys")
                .weightage(30.0)
                .kpiCategory("ROLE_KPI")
                .status("ACTIVE")
                .build();
    }

    @Test
    void testCreateKpi_Success() {
        when(kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus("HR Director", "ROLE_KPI", "ACTIVE"))
                .thenReturn(List.of(kpi1, kpi2)); // Total existing = 90%
        when(kpiMasterRepository.save(any(KpiMaster.class))).thenAnswer(i -> {
            KpiMaster saved = i.getArgument(0);
            saved.setId(3L);
            return saved;
        });

        CreateKpiMasterRequest request = new CreateKpiMasterRequest();
        request.setDesignation("HR Director");
        request.setKpiName("Compliance & Audits");
        request.setDescription("Labor laws");
        request.setWeightage(10.0); // 90 + 10 = 100%
        request.setApplicableFor("Both Employee & Manager");
        request.setKpiCategory("ROLE_KPI");

        KpiMasterDto result = hrKpiService.createKpi(request);

        assertNotNull(result);
        assertEquals("Compliance & Audits", result.getKpiName());
        assertEquals(10.0, result.getWeightage());
        assertEquals("Both Employee & Manager", result.getApplicableFor());
        verify(kpiMasterRepository, times(1)).save(any(KpiMaster.class));
    }

    @Test
    void testCreateKpi_Exceeds100Percent_ThrowsApiException() {
        when(kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus("HR Director", "ROLE_KPI", "ACTIVE"))
                .thenReturn(List.of(kpi1, kpi2)); // Total existing = 90%

        CreateKpiMasterRequest request = new CreateKpiMasterRequest();
        request.setDesignation("HR Director");
        request.setKpiName("New KPI");
        request.setDescription("Exceeding weight");
        request.setWeightage(15.0); // 90 + 15 = 105% > 100%
        request.setKpiCategory("ROLE_KPI");

        ApiException ex = assertThrows(ApiException.class, () -> {
            hrKpiService.createKpi(request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Total KPI weightage cannot exceed 100%"));
        verify(kpiMasterRepository, never()).save(any(KpiMaster.class));
    }

    @Test
    void testUpdateKpi_Exceeds100Percent_ThrowsApiException() {
        when(kpiMasterRepository.findById(1L)).thenReturn(Optional.of(kpi1));
        when(kpiMasterRepository.findByDesignationIgnoreCaseAndKpiCategoryAndStatus("HR Director", "ROLE_KPI", "ACTIVE"))
                .thenReturn(List.of(kpi1, kpi2)); // other KPI is kpi2 (30%)

        UpdateKpiMasterRequest request = new UpdateKpiMasterRequest();
        request.setKpiName("Updated Name");
        request.setDescription("Updated Desc");
        request.setWeightage(75.0); // 30 + 75 = 105% > 100%
        request.setKpiCategory("ROLE_KPI");

        ApiException ex = assertThrows(ApiException.class, () -> {
            hrKpiService.updateKpi(1L, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Total KPI weightage cannot exceed 100%"));
    }

    @Test
    void testCreateHrReviewKpi_Success() {
        when(kpiMasterRepository.findByKpiCategoryAndStatus("HR_REVIEW_KPI", "ACTIVE"))
                .thenReturn(List.of()); // No existing HR KPIs
        when(kpiMasterRepository.save(any(KpiMaster.class))).thenAnswer(i -> {
            KpiMaster saved = i.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        CreateKpiMasterRequest request = new CreateKpiMasterRequest();
        request.setKpiName("Leave Pattern");
        request.setDescription("Planned leaves criteria");
        request.setWeightage(20.0);
        request.setKpiCategory("HR_REVIEW_KPI");

        KpiMasterDto result = hrKpiService.createKpi(request);

        assertNotNull(result);
        assertEquals("Leave Pattern", result.getKpiName());
        assertEquals(20.0, result.getWeightage());
        assertEquals("HR_REVIEW_KPI", result.getKpiCategory());
        verify(kpiMasterRepository, times(1)).save(any(KpiMaster.class));
    }
}
