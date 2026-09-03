package com.aseuro.pms.controller;

import com.aseuro.pms.dto.CreateEmployeeRequest;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.Role;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.repository.KpiMasterRepository;
import com.aseuro.pms.repository.PmsAssignmentRepository;
import com.aseuro.pms.repository.PmsKpiRepository;
import com.aseuro.pms.service.DesignationService;
import com.aseuro.pms.service.EmployeeOnboardingEmailService;
import com.aseuro.pms.service.HrKpiService;
import com.aseuro.pms.service.HrLifecycleService;
import com.aseuro.pms.service.ReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HrEmployeeCreationTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PmsAssignmentRepository pmsAssignmentRepository;

    @Mock
    private PmsKpiRepository pmsKpiRepository;

    @Mock
    private KpiMasterRepository kpiMasterRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HrKpiService hrKpiService;

    @Mock
    private HrLifecycleService hrLifecycleService;

    @Mock
    private ReportService reportService;

    @Mock
    private DesignationService designationService;

    @Mock
    private EmployeeOnboardingEmailService onboardingEmailService;

    @InjectMocks
    private HrManagementController hrManagementController;

    @Test
    void testCreateEmployee_SetsMustChangePasswordTrue() {
        CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                .employeeCode("EMP-999")
                .name("Alice Test")
                .email("alice.test@aseuro.com")
                .password("Temp@12345")
                .designation("Software Engineer")
                .department("Engineering")
                .role("EMPLOYEE")
                .build();

        when(employeeRepository.findByEmail("alice.test@aseuro.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Temp@12345")).thenReturn("$2a$10$encodedTempPass");

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        when(employeeRepository.save(employeeCaptor.capture())).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            emp.setId(99L);
            return emp;
        });

        when(kpiMasterRepository.findByDesignationIgnoreCaseAndStatus("Software Engineer", "ACTIVE"))
                .thenReturn(Collections.emptyList());

        ResponseEntity<Map<String, Object>> response = hrManagementController.createEmployee(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());

        Employee capturedEmployee = employeeCaptor.getValue();
        assertNotNull(capturedEmployee);
        assertEquals("alice.test@aseuro.com", capturedEmployee.getEmail());
        assertEquals("Alice Test", capturedEmployee.getName());
        assertEquals(Role.ROLE_EMPLOYEE, capturedEmployee.getRole());
        assertTrue(capturedEmployee.getMustChangePassword(), "Newly created employee must have mustChangePassword = true");
    }
}
