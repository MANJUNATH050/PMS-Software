package com.aseuro.pms.service;

import com.aseuro.pms.dto.HrFinalizeRequest;
import com.aseuro.pms.dto.HrSaveRatingsRequest;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HrLifecycleServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PmsAssignmentRepository pmsAssignmentRepository;

    @Mock
    private PmsKpiRepository pmsKpiRepository;

    @Mock
    private KpiMasterRepository kpiMasterRepository;

    @Mock
    private EmployeeKpiRatingRepository employeeKpiRatingRepository;

    @Mock
    private EmployeeReviewRepository employeeReviewRepository;

    @Mock
    private FinalPmsResultRepository finalPmsResultRepository;

    @Mock
    private PmsHistoryRepository pmsHistoryRepository;

    @InjectMocks
    private HrLifecycleService hrLifecycleService;

    private Employee hrUser;
    private Employee employee;
    private PmsAssignment assignment;
    private PmsKpi kpi1;
    private PmsKpi kpi2;
    private EmployeeKpiRating rating1;
    private EmployeeKpiRating rating2;

    @BeforeEach
    void setUp() {
        hrUser = Employee.builder()
                .id(99L)
                .email("hr@aseuro.com")
                .name("Bob HR")
                .role(Role.ROLE_HR)
                .build();

        employee = Employee.builder()
                .id(1L)
                .email("employee@aseuro.com")
                .name("John Doe")
                .designation("Software Engineer")
                .role(Role.ROLE_EMPLOYEE)
                .build();

        assignment = PmsAssignment.builder()
                .id(10L)
                .employee(employee)
                .cycleMonth("August 2026")
                .status(PMSState.MANAGER_REVIEW_SUBMITTED)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .build();

        kpi1 = PmsKpi.builder()
                .id(101L)
                .assignment(assignment)
                .kpiName("Code Quality")
                .weightage(50.0)
                .build();

        kpi2 = PmsKpi.builder()
                .id(102L)
                .assignment(assignment)
                .kpiName("Delivery & Speed")
                .weightage(50.0)
                .build();

        rating1 = EmployeeKpiRating.builder()
                .id(1001L)
                .assignment(assignment)
                .kpi(kpi1)
                .selfRating(4.0)
                .managerRating(4.5)
                .build();

        rating2 = EmployeeKpiRating.builder()
                .id(1002L)
                .assignment(assignment)
                .kpi(kpi2)
                .selfRating(4.0)
                .managerRating(4.5)
                .build();
    }

    @Test
    void testSaveHrRatings_Success() {
        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(employeeRepository.findById(99L)).thenReturn(Optional.of(hrUser));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi1, kpi2));
        when(employeeKpiRatingRepository.findByAssignment(assignment)).thenReturn(List.of(rating1, rating2));
        when(employeeReviewRepository.findByAssignment(assignment)).thenReturn(new ArrayList<>());

        HrSaveRatingsRequest request = new HrSaveRatingsRequest();
        HrSaveRatingsRequest.HrKpiRatingEntry entry1 = new HrSaveRatingsRequest.HrKpiRatingEntry(101L, 4.8, 4.2, "HR excellent");
        HrSaveRatingsRequest.HrKpiRatingEntry entry2 = new HrSaveRatingsRequest.HrKpiRatingEntry(102L, 4.6, 4.0, "HR great");
        request.setRatings(List.of(entry1, entry2));
        request.setHrComments("Approved by HR");

        Map<String, Object> result = hrLifecycleService.saveHrRatings(10L, 99L, request);

        assertNotNull(result);
        assertEquals("HR ratings and comments saved successfully.", result.get("message"));
        assertEquals(4.5, rating1.getManagerRating());
        assertEquals(4.8, rating1.getHrRating());
        verify(employeeKpiRatingRepository, times(2)).save(any(EmployeeKpiRating.class));
        verify(employeeReviewRepository, times(1)).save(any(EmployeeReview.class));
    }

    @Test
    void testFinalizePms_Success() {
        // Prepare HR ratings
        rating1.setHrRating(4.5);
        rating2.setHrRating(4.5);

        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(employeeRepository.findById(99L)).thenReturn(Optional.of(hrUser));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi1, kpi2));
        when(employeeKpiRatingRepository.findByAssignment(assignment)).thenReturn(List.of(rating1, rating2));

        HrFinalizeRequest request = new HrFinalizeRequest();
        request.setHrComments("Appraisal completed successfully.");

        Map<String, Object> result = hrLifecycleService.finalizePms(10L, 99L, request);

        assertNotNull(result);
        assertEquals("PMS successfully finalized and published.", result.get("message"));
        assertEquals("COMPLETED", result.get("status"));
        assertEquals(4.5, (Double) result.get("finalScore"));
        assertEquals("Outstanding Performance", result.get("grade"));

        verify(pmsAssignmentRepository, times(1)).save(any(PmsAssignment.class));
        verify(finalPmsResultRepository, times(1)).save(any(FinalPmsResult.class));
        verify(pmsHistoryRepository, times(1)).save(any(PmsHistory.class));
    }

    @Test
    void testFinalizePms_MissingSelfRating_ThrowsApiException() {
        // Missing self rating on rating2
        rating2.setSelfRating(null);

        when(pmsAssignmentRepository.findById(10L)).thenReturn(Optional.of(assignment));
        when(employeeRepository.findById(99L)).thenReturn(Optional.of(hrUser));
        when(pmsKpiRepository.findByAssignment(assignment)).thenReturn(List.of(kpi1, kpi2));
        when(employeeKpiRatingRepository.findByAssignment(assignment)).thenReturn(List.of(rating1, rating2));

        HrFinalizeRequest request = new HrFinalizeRequest();

        ApiException ex = assertThrows(ApiException.class, () -> {
            hrLifecycleService.finalizePms(10L, 99L, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Self assessment ratings are incomplete"));
        verify(finalPmsResultRepository, never()).save(any(FinalPmsResult.class));
    }
}
