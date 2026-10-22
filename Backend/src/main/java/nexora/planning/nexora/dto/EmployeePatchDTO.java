package nexora.planning.nexora.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;

import java.time.LocalDate;
import java.util.Set;

@Data
public class EmployeePatchDTO {
    private String name;
    private String email;
    private String cpf;
    private String position;
    private String department;
    private String leader;
    private costCenter costCenter;
    private EmployeeStatus status;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate admissionDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate terminationDate;
    
    private Set<MicrosoftLicense> microsoftLicenses;
    private NotebookPatchDTO notebook;
    
}