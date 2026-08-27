package com.company.pms.controller;

import com.company.pms.service.HRDashboardService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/hr/dashboard")
public class HRDashboardController {
    private final HRDashboardService service;

    public HRDashboardController(HRDashboardService s) {
        service = s;
    }

    @GetMapping("/summary")
    public Object summary() {
        return service.summary();
    }

    @GetMapping("/activity")
    public List<Map<String, Object>> activity() {
        return service.activity();
    }
}
