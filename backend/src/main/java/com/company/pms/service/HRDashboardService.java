package com.company.pms.service;

import com.company.pms.dto.Dtos.DashboardSummaryResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class HRDashboardService {
    private final JdbcTemplate jdbc;

    public HRDashboardService(JdbcTemplate j) {
        jdbc = j;
    }

    public DashboardSummaryResponse summary() {
        long total = count("select count(*) from employees");
        long active = count("select count(*) from employees where status = 'ACTIVE'");
        long fresh = count("select count(*) from employees where created_at >= current_date - interval '30 days'");
        long pending = 0;
        try {
            pending = jdbc.queryForObject("select count(*) from pms_assignments where status = 'HR_REVIEW_PENDING'",
                    Long.class);
        } catch (Exception ignored) {
        }
        return new DashboardSummaryResponse(total, active, fresh == 0 ? 0 : fresh, pending);
    }

    private long count(String sql) {
        try {
            Long result = jdbc.queryForObject(sql, Long.class);
            return result == null ? 0 : result;
        } catch (Exception ignored) {
            return 0;
        }
    }

    public List<Map<String, Object>> activity() {
        try {
            return jdbc.queryForList(
                    "select employee_code as \"employeeCode\", full_name as \"fullName\", 'created' as action, created_at as \"createdAt\" from employees order by created_at desc limit 8");
        } catch (Exception e) {
            return List.of();
        }
    }
}
