package com.company.pms.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/hr")
public class HRLookupController {
    private final JdbcTemplate jdbc;

    public HRLookupController(JdbcTemplate j) {
        jdbc = j;
    }

    @GetMapping("/departments")
    public List<Map<String, Object>> departments() {
        return jdbc.queryForList("select id, name from departments where status = 'ACTIVE' order by name");
    }

    @GetMapping("/teams")
    public List<Map<String, Object>> teams() {
        return jdbc.queryForList(
                "select id, name, department_id as \"departmentId\" from teams where status = 'ACTIVE' order by name");
    }

    @GetMapping("/designations")
    public List<Map<String, Object>> designations() {
        return jdbc.queryForList("select id, name from designations where status = 'ACTIVE' order by name");
    }

    @GetMapping("/managers")
    public List<Map<String, Object>> managers() {
        return jdbc.queryForList(
                "select e.id, e.employee_code as \"employeeCode\", e.full_name as \"fullName\" from employees e join users u on u.id=e.user_id where u.role='MANAGER' and e.status='ACTIVE' order by e.full_name");
    }
}
