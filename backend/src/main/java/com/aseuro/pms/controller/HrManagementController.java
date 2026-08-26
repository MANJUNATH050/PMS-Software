package com.aseuro.pms.controller;

import com.aseuro.pms.dto.CreateEmployeeRequest;
import com.aseuro.pms.dto.DepartmentDto;
import com.aseuro.pms.dto.DesignationDto;
import com.aseuro.pms.dto.EmployeeDto;
import com.aseuro.pms.dto.ManagerOptionDto;
import com.aseuro.pms.entity.Department;
import com.aseuro.pms.entity.Designation;
import com.aseuro.pms.entity.Employee;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.entity.User;
import com.aseuro.pms.entity.UserRole;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.repository.DepartmentRepository;
import com.aseuro.pms.repository.DesignationRepository;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class HrManagementController {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> getDepartments() {
        List<DepartmentDto> list = departmentRepository.findByStatus(RecordStatus.ACTIVE).stream()
                .map(d -> new DepartmentDto(d.getId(), d.getName(), d.getDescription(), d.getStatus().name()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/designations")
    public ResponseEntity<List<DesignationDto>> getDesignations() {
        List<DesignationDto> list = designationRepository.findByStatus(RecordStatus.ACTIVE).stream()
                .map(d -> new DesignationDto(d.getId(), d.getName(), d.getDescription(), d.getStatus().name()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/managers")
    public ResponseEntity<List<ManagerOptionDto>> getManagers() {
        List<Employee> managers = employeeRepository.findByUserRoleAndStatus(UserRole.MANAGER, RecordStatus.ACTIVE);
        Map<Long, String> designationMap = designationRepository.findAll().stream()
                .collect(Collectors.toMap(Designation::getId, Designation::getName, (a, b) -> a));

        List<ManagerOptionDto> list = managers.stream()
                .map(m -> new ManagerOptionDto(
                        m.getId(),
                        m.getFullName(),
                        m.getEmployeeCode(),
                        m.getEmail(),
                        m.getDesignationId() != null ? designationMap.getOrDefault(m.getDesignationId(), "Manager") : "Manager"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeDto>> getAllEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<Long, String> deptMap = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));
        Map<Long, String> desigMap = designationRepository.findAll().stream()
                .collect(Collectors.toMap(Designation::getId, Designation::getName, (a, b) -> a));
        Map<Long, String> empNameMap = allEmployees.stream()
                .collect(Collectors.toMap(Employee::getId, Employee::getFullName, (a, b) -> a));

        List<EmployeeDto> dtoList = allEmployees.stream()
                .map(e -> new EmployeeDto(
                        e.getId(),
                        e.getUser() != null ? e.getUser().getId() : null,
                        e.getEmployeeCode(),
                        e.getFullName(),
                        e.getEmail(),
                        e.getUser() != null ? e.getUser().getRole().name() : "EMPLOYEE",
                        e.getDepartmentId(),
                        e.getDepartmentId() != null ? deptMap.getOrDefault(e.getDepartmentId(), "-") : "-",
                        e.getDesignationId(),
                        e.getDesignationId() != null ? desigMap.getOrDefault(e.getDesignationId(), "-") : "-",
                        e.getManagerId(),
                        e.getManagerId() != null ? empNameMap.getOrDefault(e.getManagerId(), "-") : "-",
                        e.getJoiningDate(),
                        e.getStatus().name(),
                        e.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    @PostMapping("/employees")
    @Transactional
    public ResponseEntity<Map<String, Object>> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        String email = request.email().trim().toLowerCase();
        String employeeCode = request.employeeCode().trim();

        if (userRepository.existsByEmailIgnoreCase(email) || employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email already exists in the system.");
        }

        if (employeeRepository.existsByEmployeeCodeIgnoreCase(employeeCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Employee Code already exists.");
        }

        // Validate manager role if managerId specified
        if (request.managerId() != null) {
            Employee manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected reporting manager does not exist."));
            if (manager.getUser() == null || manager.getUser().getRole() != UserRole.MANAGER) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Reporting Manager must have MANAGER role.");
            }
        }

        // 1. Create User
        User user = new User();
        user.setEmail(email);
        user.setUsername(email.split("@")[0]);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setStatus(RecordStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        // 2. Create Employee Profile
        Employee employee = new Employee();
        employee.setUser(savedUser);
        employee.setEmployeeCode(employeeCode);
        employee.setFullName(request.fullName().trim());
        employee.setEmail(email);
        employee.setDepartmentId(request.departmentId());
        employee.setDesignationId(request.designationId());
        employee.setTeamId(request.teamId());
        employee.setManagerId(request.managerId());
        employee.setJoiningDate(request.joiningDate());
        employee.setStatus(RecordStatus.ACTIVE);
        Employee savedEmp = employeeRepository.save(employee);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account provisioned successfully for " + request.role() + ": " + request.fullName(),
                "id", savedEmp.getId(),
                "userId", savedUser.getId(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().name()
        ));
    }
}
