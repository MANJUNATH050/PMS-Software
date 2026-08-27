package com.company.pms.service;

import com.company.pms.dto.Dtos.*;
import com.company.pms.entity.*;
import com.company.pms.exception.ApiException;
import com.company.pms.repository.EmployeeRepository;
import com.company.pms.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class EmployeeService {
    private final EmployeeRepository employees;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;

    public EmployeeService(EmployeeRepository e, UserRepository u, PasswordEncoder p, JdbcTemplate j) {
        employees = e;
        users = u;
        encoder = p;
        jdbc = j;
    }

    public EmployeeResponse create(EmployeeCreateRequest r) {
        if (employees.existsByEmployeeCodeIgnoreCase(r.employeeCode()) || users.existsByUsernameIgnoreCase(r.employeeCode()))
            throw new ApiException(409, "Employee ID already exists");
        if (employees.existsByEmailIgnoreCase(r.email()) || users.existsByEmailIgnoreCase(r.email()))
            throw new ApiException(409, "Email already exists");
        validateReference("departments", r.departmentId(), "Department not found");
        if (r.teamId() != null) {
            validateReference("teams", r.teamId(), "Team not found");
            if (!jdbc.queryForObject(
                    "select exists(select 1 from teams where id=? and department_id=? and status='ACTIVE')",
                    Boolean.class, r.teamId(), r.departmentId()))
                throw new ApiException(400, "Team does not belong to the selected department");
        }
        validateReference("designations", r.designationId(), "Designation not found");
        if (r.managerId() != null && r.managerId() > 0) {
            if (!jdbc.queryForObject(
                    "select exists(select 1 from employees e join users u on u.id=e.user_id where e.id=? and u.role='MANAGER' and e.status='ACTIVE')",
                    Boolean.class, r.managerId()))
                throw new ApiException(400, "Reporting manager is invalid");
        }

        // 1. Create corresponding User account so Employee can log in
        User u = new User();
        u.setUsername(r.employeeCode().trim());
        u.setEmail(r.email().trim().toLowerCase());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(r.role() != null ? r.role() : UserRole.EMPLOYEE);
        u.setStatus(RecordStatus.ACTIVE);
        User savedUser = users.save(u);

        // 2. Create Employee profile linked to User account
        Employee e = new Employee();
        e.setUserId(savedUser.getId());
        e.setEmployeeCode(r.employeeCode().trim());
        e.setFullName(r.fullName().trim());
        e.setEmail(r.email().trim().toLowerCase());
        e.setDepartmentId(r.departmentId());
        e.setTeamId(r.teamId());
        e.setDesignationId(r.designationId());
        e.setManagerId(r.managerId());
        e.setJoiningDate(r.joiningDate());
        e.setStatus(r.status() == null ? RecordStatus.ACTIVE : r.status());
        e.setCreatedAt(Instant.now());
        var saved = employees.save(e);
        return new EmployeeResponse(saved.getId(), saved.getEmployeeCode(), saved.getFullName(), saved.getEmail(),
                saved.getStatus().name());
    }

    private void validateReference(String table, Long id, String message) {
        if (!jdbc.queryForObject("select exists(select 1 from " + table + " where id=? and status='ACTIVE')",
                Boolean.class, id))
            throw new ApiException(400, message);
    }
}
