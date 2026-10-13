package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.enums.costCenter;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EmployeeRequestDTO {
    @NotBlank(message = "O nome é obrigatório")
    private String name;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    private String cpf;

    @NotBlank(message = "O cargo é obrigatório")
    private String position;

    @NotBlank(message = "O departamento é obrigatório")
    private String department;

    private String leader;

    @NotNull(message = "O centro de custo é obrigatório")
    private costCenter costCenter;

    private Set<MicrosoftLicense> microsoftLicenses;

    @NotNull(message = "O status é obrigatório")
    private EmployeeStatus status;

    private LocalDate admissionDate;
    private LocalDate terminationDate;
    private Long notebookId;
}