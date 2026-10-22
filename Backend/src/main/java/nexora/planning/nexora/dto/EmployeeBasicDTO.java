package nexora.planning.nexora.dto;

import java.util.Set;

import lombok.Data;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.enums.costCenter;

@Data
public class EmployeeBasicDTO {
    private Long id;
    private String name;
    private String email;
    private String position;
    private String department;
    private costCenter costCenter;
    private Set<MicrosoftLicense> microsoftLicenses;
    private EmployeeStatus status;
}
