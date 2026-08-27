package com.company.pms.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "employee_code", unique = true, nullable = false)
    private String employeeCode;
    @Column(name = "full_name", nullable = false)
    private String fullName;
    @Column(nullable = false)
    private String email;
    @Column(name = "department_id")
    private Long departmentId;
    @Column(name = "team_id")
    private Long teamId;
    @Column(name = "designation_id")
    private Long designationId;
    @Column(name = "manager_id")
    private Long managerId;
    @Column(name = "joining_date")
    private LocalDate joiningDate;
    @Enumerated(EnumType.STRING)
    private RecordStatus status;
    @Column(name = "created_at")
    private java.time.Instant createdAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long v) {
        userId = v;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public RecordStatus getStatus() {
        return status;
    }

    public java.time.Instant getCreatedAt() {
        return createdAt;
    }

    public void setEmployeeCode(String v) {
        employeeCode = v;
    }

    public void setFullName(String v) {
        fullName = v;
    }

    public void setEmail(String v) {
        email = v;
    }

    public void setDepartmentId(Long v) {
        departmentId = v;
    }

    public void setTeamId(Long v) {
        teamId = v;
    }

    public void setDesignationId(Long v) {
        designationId = v;
    }

    public void setManagerId(Long v) {
        managerId = v;
    }

    public void setJoiningDate(LocalDate v) {
        joiningDate = v;
    }

    public void setStatus(RecordStatus v) {
        status = v;
    }

    public void setCreatedAt(java.time.Instant v) {
        createdAt = v;
    }
}
