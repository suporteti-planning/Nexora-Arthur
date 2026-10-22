package nexora.planning.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import nexora.planning.nexora.enums.MonitorStatus;
import nexora.planning.nexora.enums.costCenter;
import lombok.Data;

@Data
public class MonitorRequestDTO {
    @NotBlank(message = "O nome/patrimônio é obrigatório")
    private String name;

    @NotBlank(message = "A marca é obrigatória")
    private String brand;

    @NotBlank(message = "O modelo é obrigatório")
    private String model;

    @NotBlank(message = "O número de série é obrigatório")
    private String serialNumber;

    private String observations;
    private Double price;
    private Long employeeId;

    @NotNull(message = "O centro de custo é obrigatório")
    private costCenter costCenter;

    @NotNull(message = "O status é obrigatório")
    private MonitorStatus status;
}
