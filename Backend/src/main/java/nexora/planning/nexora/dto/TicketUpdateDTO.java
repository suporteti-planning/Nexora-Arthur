package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.TicketStatus;
import lombok.Data;

@Data
public class TicketUpdateDTO {
    private TicketStatus status;
    private Long         assigneeId;
    private String       note;
}
