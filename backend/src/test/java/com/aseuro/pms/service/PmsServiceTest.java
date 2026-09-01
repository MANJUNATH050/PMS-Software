package com.aseuro.pms.service;

import com.aseuro.pms.dto.KpiRatingRequest;
import com.aseuro.pms.dto.PmsAssignmentDto;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PmsServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PmsAssignmentRepository pmsAssignmentRepository;

    @Mock
    private PmsKpiRepository pmsKpiRepository;

    @Mock
    private EmployeeKpiRatingRepository employeeKpiRatingRepository;

    @Mock
    private EmployeeReviewRepository employeeReviewRepository;

    @Mock
    private FinalPmsResultRepository finalPmsResultRepository;

    @Mock
    private PmsHistoryRepository pmsHistoryRepository;

    @Mock
    private KpiMasterRepository kpiMasterRepository;

    @InjectMocks
    private PmsService pmsService;

    private Employee employee;
    private PmsAssignment assignment;
    private PmsKpi kpi;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .id(1L)
                .email("employee@aseuro.com")
                .name("John Doe")
                .role(Role.ROLE_EMPLOYEE)
                .accountStatus("ACTIVE")
                .build();

        assignment = PmsAssignment.builder()
                .id(10L)
                .employee(employee)
                .cycleMonth("August 2026")
                .status(PMSState.PMS_STARTED)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .build();

        kpi = PmsKpi.builder()
                .id(100L)
                .assignment(assignment)
                .kpiName("Code Quality")
                .weightage(20.0)
                .build();
    }

    @Test
    void testGetAssignmentDetail_Success() {
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi));
        when(employeeKpiRatingRepository.findByAssignment(assignment)).thenReturn(new ArrayList<>());
        when(employeeReviewRepository.findByAssignment(assignment)).thenReturn(new ArrayList<>());

        PmsAssignmentDto result = pmsService.getAssignmentDetail(1L, 10L);

        assertNotNull(result);
        assertEquals("August 2026", result.getCycleMonth());
        assertEquals("PMS_STARTED", result.getStatus());
        assertEquals(1, result.getKpis().size());
        assertEquals("Code Quality", result.getKpis().get(0).getKpiName());
    }

    @Test
    void testGetAssignmentDetail_Unauthorized() {
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));

        // Requesting details of John Doe's assignment (id 1L) using employee id 2L
        assertThrows(AccessDeniedException.class, () -> {
            pmsService.getAssignmentDetail(2L, 10L);
        });
    }

    @Test
    void testSaveDraft_Success() {
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi));
        when(employeeKpiRatingRepository.findByAssignment(assignment)).thenReturn(new ArrayList<>());

        KpiRatingRequest request = new KpiRatingRequest();
        KpiRatingRequest.KpiRatingEntry entry = new KpiRatingRequest.KpiRatingEntry();
        entry.setKpiId(100L);
        entry.setSelfRating(4.5);
        entry.setComments("Good code quality.");
        request.setRatings(List.of(entry));

        PmsAssignmentDto result = pmsService.saveSelfAssessmentDraft(1L, 10L, request);

        assertNotNull(result);
        verify(employeeKpiRatingRepository, times(1)).save(any(EmployeeKpiRating.class));
        verify(pmsAssignmentRepository, times(1)).save(any(PmsAssignment.class));
    }

    @Test
    void testSubmitAssessment_ValidationError() {
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi));

        KpiRatingRequest request = new KpiRatingRequest();
        KpiRatingRequest.KpiRatingEntry entry = new KpiRatingRequest.KpiRatingEntry();
        entry.setKpiId(100L);
        entry.setSelfRating(6.0); // Invalid score (> 5.0)
        entry.setComments("Invalid rating");
        request.setRatings(List.of(entry));

        assertThrows(IllegalArgumentException.class, () -> {
            pmsService.submitSelfAssessment(1L, 10L, request);
        });
    }

    @Test
    void testSubmitAssessment_CannotEditFinalized() {
        assignment.setStatus(PMSState.COMPLETED); // Already finalized
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));

        KpiRatingRequest request = new KpiRatingRequest();

        assertThrows(IllegalArgumentException.class, () -> {
            pmsService.submitSelfAssessment(1L, 10L, request);
        });
    }
}
