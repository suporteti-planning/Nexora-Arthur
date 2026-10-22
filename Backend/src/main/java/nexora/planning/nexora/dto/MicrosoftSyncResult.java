package nexora.planning.nexora.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
public class MicrosoftSyncResult {
    private boolean success;
    private int totalMicrosoftUsers;
    private int imported;
    private int updated;
    private int errors;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String errorMessage;
    private Map<String, String> errorDetails = new HashMap<>();

    public void addError(String email, String message) {
        errorDetails.put(email, message);
    }

    public String getSummary() {
        return String.format(
            "Total: %d | Importados: %d | Atualizados: %d | Erros: %d",
            totalMicrosoftUsers, imported, updated, errors
        );
    }
}