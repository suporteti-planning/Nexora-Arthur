package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.MonitorStatus;
import nexora.planning.nexora.enums.costCenter;
import lombok.Data;

@Data
public class MonitorResponseDTO {
    private Long id;
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private String observations;
    private Double price;
    private costCenter costCenter;
    private MonitorStatus status;
    private EmployeeBasicDTO employee;
}
