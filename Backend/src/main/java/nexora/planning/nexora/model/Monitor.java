package nexora.planning.nexora.model;

import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.enums.costCenter;

import jakarta.persistence.*;
import lombok.*;

/**
 * Monitor — entidade independente (não usa herança de Hardware para não
 * impactar a tabela notebooks existente).
 */
@Entity
@Table(name = "monitors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Monitor {

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

    @Column(columnDefinition = "TEXT")
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Employee employee;
}
