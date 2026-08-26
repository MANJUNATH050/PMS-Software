package com.aseuro.pms.controller;

import com.aseuro.pms.dto.EmployeeDto;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/employee")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/profile")
    public ResponseEntity<EmployeeDto> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        EmployeeDto profile = employeeService.getEmployeeProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }
}
