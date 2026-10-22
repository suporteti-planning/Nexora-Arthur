package nexora.planning.nexora.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class NotebookImportResultDTO {
    private boolean success;
    private int totalRows;
    private int imported;
    private int updated;
    private int errors;
    private List<String> importedNotebooks = new ArrayList<>();
    private Map<String, String> errorDetails = new HashMap<>();
    private String message;

    public void addError(String notebook, String message) {
        this.errorDetails.put(notebook, message);
        this.errors++;
    }

    public String getSummary() {
        return String.format(
            "Total: %d | Importados: %d | Atualizados: %d | Erros: %d",
            totalRows, imported, updated, errors
        );
    }
}