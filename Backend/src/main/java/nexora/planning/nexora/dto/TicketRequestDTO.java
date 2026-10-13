package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;

@Data
public class TicketRequestDTO {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private TicketPriority priority;

    @NotNull
    private DestDepartment destDepartment;

    private String sourceRoute;

    // ── Campos específicos de chamados DOC ────────────────────────────────────
    /** Obrigatório quando destDepartment == DOC */
    private Long processId;
    private Long stepId;

    /** Dados da empresa (quando a etapa exige) */
    private String companyName;
    private String companyCnpj;

    /** E-mail de destino para etapas "Email com Endereço Livre" */
    private String emailDestination;

    /** Campos complementares dinâmicos */
    private Map<String, Object> extraData;
}
