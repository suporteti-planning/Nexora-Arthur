package nexora.planning.nexora.dto;

import java.time.LocalDate;
import java.util.Set;

import lombok.Data;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.enums.costCenter;

@Data
public class EmployeeResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String cpf;
    private String position;
    private String department;
    private String leader;
    private costCenter costCenter;
    private NotebookDTO notebook;
    private Set<MicrosoftLicense> microsoftLicenses;
    private EmployeeStatus status;
    private LocalDate admissionDate;
    private LocalDate terminationDate;

    public EmployeeResponseDTO(Employee employee) {
        this.id = employee.getId();
        this.name = employee.getName();
        this.email = employee.getEmail();
        this.cpf = employee.getCpf();
        this.position = employee.getPosition();
        this.department = employee.getDepartment();
        this.leader = employee.getLeader();
        this.costCenter = employee.getCostCenter();
        this.microsoftLicenses = employee.getMicrosoftLicenses();
        this.status = employee.getStatus();
        this.admissionDate = employee.getAdmissionDate();
        this.terminationDate = employee.getTerminationDate();

        if (employee.getNotebook() != null) {
            this.notebook = new NotebookDTO(employee.getNotebook());
        }
    }

    public EmployeeResponseDTO(EmployeeResponseDTO employee) {
    }
}