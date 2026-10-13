package nexora.planning.nexora.model;

import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.NotebookStatus;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "notebooks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notebook {

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

    @Column(nullable = false)
    private String processor;

    @Column(nullable = false)
    private String ram;

    @Column(nullable = false)
    private String storage;

    private String operatingSystem;

    private String observations;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private costCenter costCenter;

    @OneToOne
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotebookStatus status;

    @Column
    private Double price;

}