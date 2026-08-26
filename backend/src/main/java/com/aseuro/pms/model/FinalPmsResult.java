package com.aseuro.pms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "final_pms_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalPmsResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private PmsAssignment assignment;

    @Column(nullable = false)
    private Double finalScore;

    @Column(nullable = false)
    private String grade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalized_by")
    private Employee finalizedBy;

    private LocalDate finalizedDate;
}
