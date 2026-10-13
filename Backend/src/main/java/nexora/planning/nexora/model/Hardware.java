package nexora.planning.nexora.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.enums.costCenter;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "hardware")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "hardware_type")
@Getter
@Setter
public abstract class Hardware {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private costCenter costCenter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HardwareStatus status;

    private Double price;

    @Column(columnDefinition = "text")
    private String observations;
}
