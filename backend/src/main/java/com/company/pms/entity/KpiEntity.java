package com.company.pms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "kpis")
public class KpiEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "designation_id")
    private Long designationId;

    @Column(name = "kpi_name", nullable = false)
    private String kpiName;

    @Column(name = "measurement_percent", nullable = false)
    private Double measurementPercent;

    @Column(name = "self_rating_default")
    private Double selfRatingDefault;

    @Column(name = "manager_rating_default")
    private Double managerRatingDefault;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDesignationId() {
        return designationId;
    }

    public void setDesignationId(Long designationId) {
        this.designationId = designationId;
    }

    public String getKpiName() {
        return kpiName;
    }

    public void setKpiName(String kpiName) {
        this.kpiName = kpiName;
    }

    public Double getMeasurementPercent() {
        return measurementPercent;
    }

    public void setMeasurementPercent(Double measurementPercent) {
        this.measurementPercent = measurementPercent;
    }

    public Double getSelfRatingDefault() {
        return selfRatingDefault;
    }

    public void setSelfRatingDefault(Double selfRatingDefault) {
        this.selfRatingDefault = selfRatingDefault;
    }

    public Double getManagerRatingDefault() {
        return managerRatingDefault;
    }

    public void setManagerRatingDefault(Double managerRatingDefault) {
        this.managerRatingDefault = managerRatingDefault;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
