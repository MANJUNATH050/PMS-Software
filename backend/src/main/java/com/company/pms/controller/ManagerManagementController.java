package com.company.pms.controller;

import com.company.pms.dto.Dtos.*;
import com.company.pms.entity.User;
import com.company.pms.entity.UserRole;
import com.company.pms.entity.RecordStatus;
import com.company.pms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/managers")
public class ManagerManagementController {

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public ManagerManagementController(JdbcTemplate jdbc, UserRepository userRepository, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.userRepository = userRepository;
        this.encoder = encoder;
    }

    @GetMapping("/list")
    public List<Map<String, Object>> getManagers() {
        return jdbc.queryForList(
                "SELECT e.id, e.employee_code as \"employeeCode\", e.full_name as \"fullName\", e.email, d.name as \"departmentName\", des.name as \"designationName\" " +
                "FROM employees e " +
                "JOIN users u ON u.id = e.user_id " +
                "LEFT JOIN departments d ON d.id = e.department_id " +
                "LEFT JOIN designations des ON des.id = e.designation_id " +
                "WHERE u.role = 'MANAGER' AND e.status = 'ACTIVE' " +
                "ORDER BY e.full_name"
        );
    }

    @PostMapping
    public ResponseEntity<?> createManager(@RequestBody ManagerCreateRequest req) {
        try {
            if (userRepository.existsByEmailIgnoreCase(req.email())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Manager email already registered."));
            }

            User u = new User();
            u.setUsername(req.fullName());
            u.setEmail(req.email());
            u.setPasswordHash(encoder.encode(req.password()));
            u.setRole(UserRole.MANAGER);
            u.setStatus(RecordStatus.ACTIVE);
            User savedUser = userRepository.save(u);

            String empCode = "MGR" + String.format("%03d", System.currentTimeMillis() % 1000);
            Long deptId = req.departmentId() != null ? req.departmentId() : 1L;
            Long desigId = req.designationId() != null ? req.designationId() : 2L;

            jdbc.update(
                "INSERT INTO employees (user_id, employee_code, full_name, email, department_id, designation_id, status) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')",
                savedUser.getId(), empCode, req.fullName(), req.email(), deptId, desigId
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Manager created successfully", "employeeCode", empCode));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error creating manager: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteManager(@PathVariable Long id) {
        jdbc.update("UPDATE employees SET status = 'INACTIVE' WHERE id = ?", id);
        return ResponseEntity.noContent().build();
    }
}
