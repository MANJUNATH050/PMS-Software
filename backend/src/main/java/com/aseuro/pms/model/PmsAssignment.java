package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "pms_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmsAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String cycleMonth; // e.g., "August 2026"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PMSState status;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate submissionDeadline;
    private LocalDate finalizedDate;
    private Double overallScore;
    private String performanceGrade;
}
