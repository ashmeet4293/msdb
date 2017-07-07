package com.icesoft.msdb.domain;

import java.io.Serializable;
import java.util.Objects;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A PointsSystem.
 */
@Entity
@Table(name = "points_system")
@Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
//@Document(indexName = "pointssystem")
public class PointsSystem extends AbstractAuditingEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(max = 50)
    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Size(max = 100)
    @Column(name = "description", length = 100, nullable = false)
    private String description;

    @Column(name = "points")
    private String points;

    @Column(name = "points_most_lead_laps")
    private Integer pointsMostLeadLaps;

    @Column(name = "points_fast_lap")
    private Integer pointsFastLap;

    @Column(name = "points_pole")
    private Integer pointsPole;

    @Column(name = "points_lead_lap")
    private Integer pointsLeadLap;
    
    @Column(name="active")
    private Boolean active;

    public Boolean isActive() {
		return active;
	}
    
    public PointsSystem active(Boolean active) {
    	this.active = active;
    	return this;
    }

	public void setActive(Boolean active) {
		this.active = active;
	}

	public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public PointsSystem name(String name) {
        this.name = name;
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public PointsSystem description(String description) {
        this.description = description;
        return this;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPoints() {
        return points;
    }
    
    @Transient
    public int[] disclosePoints() {
    	String[] tmp = StringUtils.remove(points, " ").split(",");
		int[] result = new int[tmp.length];
		for(int i = 0; i < result.length; i++) {
			result[i] = Integer.parseInt(tmp[i]);
		}
		return result;
    }

    public PointsSystem points(String points) {
        this.points = points;
        return this;
    }

    public void setPoints(String points) {
        this.points = points;
    }

    public Integer getPointsMostLeadLaps() {
        return pointsMostLeadLaps;
    }

    public PointsSystem pointsMostLeadLaps(Integer pointsMostLeadLaps) {
        this.pointsMostLeadLaps = pointsMostLeadLaps;
        return this;
    }

    public void setPointsMostLeadLaps(Integer pointsMostLeadLaps) {
        this.pointsMostLeadLaps = pointsMostLeadLaps;
    }

    public Integer getPointsFastLap() {
        return pointsFastLap;
    }

    public PointsSystem pointsFastLap(Integer pointsFastLap) {
        this.pointsFastLap = pointsFastLap;
        return this;
    }

    public void setPointsFastLap(Integer pointsFastLap) {
        this.pointsFastLap = pointsFastLap;
    }

    public Integer getPointsPole() {
        return pointsPole;
    }

    public PointsSystem pointsPole(Integer pointsPole) {
        this.pointsPole = pointsPole;
        return this;
    }

    public void setPointsPole(Integer pointsPole) {
        this.pointsPole = pointsPole;
    }

    public Integer getPointsLeadLap() {
        return pointsLeadLap;
    }

    public PointsSystem pointsLeadLap(Integer pointsLeadLap) {
        this.pointsLeadLap = pointsLeadLap;
        return this;
    }

    public void setPointsLeadLap(Integer pointsLeadLap) {
        this.pointsLeadLap = pointsLeadLap;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        PointsSystem pointsSystem = (PointsSystem) o;
        if (pointsSystem.getId() == null || getId() == null) {
            return false;
        }
        return Objects.equals(getId(), pointsSystem.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(getId());
    }

    @Override
    public String toString() {
        return "PointsSystem{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", description='" + getDescription() + "'" +
            ", points='" + getPoints() + "'" +
            ", pointsMostLeadLaps='" + getPointsMostLeadLaps() + "'" +
            ", pointsFastLap='" + getPointsFastLap() + "'" +
            ", pointsPole='" + getPointsPole() + "'" +
            ", pointsLeadLap='" + getPointsLeadLap() + "'" +
            "}";
    }
}
