package com.company.pms.controller;

import com.company.pms.dto.Dtos.*;
import com.company.pms.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/employees")
public class EmployeeController {
    private final EmployeeService service;

    public EmployeeController(EmployeeService s) {
        service = s;
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }
}
