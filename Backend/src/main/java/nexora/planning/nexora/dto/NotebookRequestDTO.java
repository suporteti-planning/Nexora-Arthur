package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.costCenter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import nexora.planning.nexora.enums.HardwareStatus;


@Data
public class NotebookRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    private String name;

    @NotBlank(message = "A marca é obrigatória")
    private String brand;

    @NotBlank(message = "O modelo é obrigatório")
    private String model;

    @NotBlank(message = "O número de série é obrigatório")
    private String serialNumber;

    @NotBlank(message = "O processador é obrigatório")
    private String processor;

    @NotBlank(message = "A memória RAM é obrigatória")
    private String ram;

    private String storage;

    private String operatingSystem;

    private String observations;

    private String inactivationReason;

    private String maintenanceDefect;

    private String maintenanceSolution;


    @NotNull(message = "O status é obrigatório")
    private HardwareStatus status;

    private Long employeeId;

    private costCenter costCenter;

    private Double price;
}