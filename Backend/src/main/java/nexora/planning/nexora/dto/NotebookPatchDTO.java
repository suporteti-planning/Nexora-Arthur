package nexora.planning.nexora.dto;

import lombok.Data;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.HardwareStatus;


@Data
public class NotebookPatchDTO {
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private HardwareStatus status;
    private costCenter costCenter;
    private String observations;
    private Double price;
}