package nexora.planning.nexora.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "notebooks")
@DiscriminatorValue("NOTEBOOK")
@PrimaryKeyJoinColumn(name = "id")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Notebook extends Hardware {

    @Column(nullable = false)
    private String processor;

    @Column(nullable = false)
    private String ram;

    @Column(nullable = false)
    private String storage;

    private String operatingSystem;

    @OneToOne
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;
}