package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "pms_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmsHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String cycleMonth;

    @Column(nullable = false)
    private Double finalScore;

    @Column(nullable = false)
    private String grade;

    private LocalDate finalizedDate;
    
    private Long assignmentId;

    private String filePath; // Path to generated PDF/Excel if any
}
