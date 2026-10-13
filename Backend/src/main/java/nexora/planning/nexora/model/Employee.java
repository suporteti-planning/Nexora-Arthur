package nexora.planning.nexora.model;

import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "microsoft_id", unique = true)
    private String microsoftId;

    @Column(unique = true, nullable = true)
    private String cpf;

    @Column(nullable = false)
    private String position;

    @Column(nullable = false)
    private String department;

    private String leader;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private costCenter costCenter;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Notebook notebook;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeStatus status;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @ElementCollection
    @CollectionTable(
        name = "employee_microsoft_licenses",
        joinColumns = @JoinColumn(name = "employee_id")
    )
    @Column(name = "microsoftlicense")
    @Enumerated(EnumType.STRING)
    @BatchSize(size = 10)
    private Set<MicrosoftLicense> microsoftLicenses = new HashSet<>();

    // Método auxiliar para adicionar licença
    public void addMicrosoftLicense(MicrosoftLicense license) {
        if (this.microsoftLicenses == null) {
            this.microsoftLicenses = new HashSet<>();
        }
        this.microsoftLicenses.add(license);
    }

    // Método auxiliar para remover licença
    public void removeMicrosoftLicense(MicrosoftLicense license) {
        if (this.microsoftLicenses != null) {
            this.microsoftLicenses.remove(license);
        }
    }

    // Método auxiliar para verificar se tem uma licença específica
    public boolean hasMicrosoftLicense(MicrosoftLicense license) {
        return this.microsoftLicenses != null && this.microsoftLicenses.contains(license);
    }
}
