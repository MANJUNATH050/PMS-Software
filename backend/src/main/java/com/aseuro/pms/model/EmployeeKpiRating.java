package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_kpi_ratings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeKpiRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private PmsAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_id", nullable = false)
    private PmsKpi kpi;

    private Double selfRating; // 0.0 to 5.0
    private Double managerRating; // 0.0 to 5.0
    private Double hrRating; // 0.0 to 5.0

    @Column(columnDefinition = "TEXT")
    private String comments; // Employee self-assessment comment

    @Column(name = "manager_comment", columnDefinition = "TEXT")
    private String managerComment;

    @Column(name = "hr_comment", columnDefinition = "TEXT")
    private String hrComment;

    private String status; // "DRAFT", "SUBMITTED"

    public String getEmployeeComment() {
        return comments;
    }

    public void setEmployeeComment(String employeeComment) {
        this.comments = employeeComment;
    }
}
