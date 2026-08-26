package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pms_kpis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmsKpi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private PmsAssignment assignment;

    @Column(nullable = false)
    private String kpiName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double weightage; // e.g., 20.0 (for 20%)
}
