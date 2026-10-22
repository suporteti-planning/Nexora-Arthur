package nexora.planning.nexora.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStoreDTO {
    private Long id;
    private UUID eventId;
    private String eventType;
    private String aggregateType;
    private Long aggregateId;
    private Map<String, Object> eventData;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
    private String createdBy;
    private String displayText;
}