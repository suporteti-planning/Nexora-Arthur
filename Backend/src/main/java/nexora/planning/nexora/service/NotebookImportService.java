package nexora.planning.nexora.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nexora.planning.nexora.dto.NotebookImportResultDTO;
import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.model.Notebook;
import nexora.planning.nexora.repository.EmployeeRepository;
import nexora.planning.nexora.repository.NotebookRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.Map.Entry;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotebookImportService {

    private final NotebookRepository notebookRepository;
    private final EmployeeRepository employeeRepository;
    private final NotebookService notebookService;

    @Transactional
    public NotebookImportResultDTO importFromExcel(MultipartFile file) {
        log.info("INICIANDO IMPORTAÇÃO DE NOTEBOOKS: {}", file.getOriginalFilename());
        
        NotebookImportResultDTO result = new NotebookImportResultDTO();
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // Mapear colunas pelo cabeçalho
            Row headerRow = sheet.getRow(0);
            Map<String, Integer> columns = mapColumns(headerRow);
            
            log.info("Colunas encontradas: {}", columns.keySet());
            
            result.setTotalRows(sheet.getLastRowNum());
            
            // Processar cada linha
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isEmptyRow(row)) continue;
                
                try {
                    processRow(row, columns, result, i + 1);
                } catch (Exception e) {
                    String notebookName = getCellValue(row, columns.get("NOME"));
                    result.addError(notebookName, "Linha " + (i + 1) + ": " + e.getMessage());
                    log.error("Erro ao processar linha {}: {}", i + 1, e.getMessage());
                }
            }
            
            result.setSuccess(result.getErrors() == 0);
            result.setMessage(result.getSummary());
            
            log.info("IMPORTAÇÃO CONCLUÍDA: {}", result.getSummary());
            
        } catch (Exception e) {
            log.error("Erro na importação: {}", e.getMessage());
            result.setSuccess(false);
            result.setMessage("Erro ao importar arquivo: " + e.getMessage());
        }
        
        return result;
    }

    private void processRow(Row row, Map<String, Integer> columns, 
                            NotebookImportResultDTO result, int rowNumber) {
        
        String name = getCellValue(row, columns.get("NOME"));
        String brand = getCellValue(row, columns.get("MARCA"));
        String model = getCellValue(row, columns.get("MODELO"));
        String serialNumber = getCellValue(row, columns.get("SERIAL"));
        String processor = getCellValue(row, columns.get("PROCESSADOR"));
        String ram = getCellValue(row, columns.get("RAM"));
        String storage = getCellValue(row, columns.get("ARMAZENAMENTO"));
        String operatingSystem = getCellValue(row, columns.get("SISTEMA_OPERACIONAL"));
        String observations = getCellValue(row, columns.get("OBSERVACOES"));
        String costCenterStr = getCellValue(row, columns.get("CENTRO_CUSTO"));
        String statusStr = getCellValue(row, columns.get("STATUS"));
        String employeeEmail = getCellValue(row, columns.get("EMAIL"));
        String priceStr = getCellValue(row, columns.get("PRECO"));
        
        // Validações
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Nome do notebook é obrigatório");
        }
        if (serialNumber == null || serialNumber.isBlank()) {
            throw new RuntimeException("Número de série é obrigatório");
        }
        
        // Converter costCenter
        costCenter costCenter = parseCostCenter(costCenterStr);
        
        // Converter status
        HardwareStatus status = parseStatus(statusStr);
        
        // Converter preço
        Double price = parsePrice(priceStr);
        
        // Verificar se já existe
        Optional<Notebook> existing = notebookRepository.findBySerialNumber(serialNumber);
        
        Notebook notebook;
        if (existing.isPresent()) {
            notebook = existing.get();
            result.setUpdated(result.getUpdated() + 1);
            log.debug("Notebook existente, atualizando: {}", serialNumber);
        } else {
            notebook = new Notebook();
            result.setImported(result.getImported() + 1);
            log.debug("Novo notebook: {}", serialNumber);
        }
        
        // Preencher dados
        notebook.setName(name);
        notebook.setBrand(brand != null ? brand : "Não informado");
        notebook.setModel(model != null ? model : "Não informado");
        notebook.setSerialNumber(serialNumber);
        notebook.setProcessor(processor != null ? processor : "Não informado");
        notebook.setRam(ram != null ? ram : "Não informado");
        notebook.setStorage(storage != null ? storage : "Não informado");
        notebook.setOperatingSystem(operatingSystem);
        notebook.setObservations(observations);
        notebook.setCostCenter(costCenter);
        notebook.setStatus(status);
        notebook.setPrice(price);
        
        // Vincular ao colaborador pelo e-mail
        if (employeeEmail != null && !employeeEmail.isBlank()) {
            Optional<Employee> employeeOpt = employeeRepository.findByEmail(employeeEmail.trim());
            
            if (employeeOpt.isPresent()) {
                Employee employee = employeeOpt.get();
                notebook.setEmployee(employee);
                employee.setNotebook(notebook);
                log.debug("Notebook {} vinculado ao colaborador {}", serialNumber, employeeEmail);
            } else {
                result.addError(name, "Colaborador não encontrado: " + employeeEmail);
                log.warn("Colaborador não encontrado: {}", employeeEmail);
            }
        }
        
        // Salvar
        notebook = notebookRepository.save(notebook);
        
        // Log do evento
        if (existing.isEmpty()) {
            // eventStoreService.logNotebookCreated(...)
        }
        
        result.getImportedNotebooks().add(name);
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private Map<String, Integer> mapColumns(Row headerRow) {
        Map<String, Integer> columns = new HashMap<>();
        
        // Mapeamento flexível: aceita variações de nome
        Map<String, String[]> aliases = new HashMap<>();
            aliases.put("NOME", new String[]{"NOME", "NOME-PATRIMONIO", "NOME PATRIMONIO", "PATRIMONIO"});
            aliases.put("MARCA", new String[]{"MARCA", "BRAND"});
            aliases.put("MODELO", new String[]{"MODELO", "MODEL"});
            aliases.put("SERIAL", new String[]{"SERIAL", "NUMERO DE SERIE", "NÚMERO DE SÉRIE", "SERIALNUMBER", "S/N"});
            aliases.put("PROCESSADOR", new String[]{"PROCESSADOR", "PROCESSOR", "CPU"});
            aliases.put("RAM", new String[]{"RAM", "MEMORIA", "MEMÓRIA"});
            aliases.put("ARMAZENAMENTO", new String[]{"ARMAZENAMENTO", "STORAGE", "DISCO", "HD", "SSD"});
            aliases.put("SISTEMA_OPERACIONAL", new String[]{"SISTEMA OPERACIONAL", "SISTEMA_OPERACIONAL", "SO", "OS", "OPERATING SYSTEM"});
            aliases.put("OBSERVACOES", new String[]{"OBSERVACOES", "OBSERVAÇÕES", "OBSERVATIONS", "OBS"});
            aliases.put("CENTRO_CUSTO", new String[]{"CENTRO DE CUSTO", "CENTRO_CUSTO", "COSTCENTER", "COST CENTER"});
            aliases.put("STATUS", new String[]{"STATUS", "SITUACAO", "SITUAÇÃO"});
            aliases.put("EMAIL", new String[]{"EMAIL", "E-MAIL", "RESPONSAVEL", "RESPONSÁVEL", "COLABORADOR"});
            aliases.put("PRECO", new String[]{"PRECO", "PREÇO", "PRICE", "VALOR"});
        
        for (Cell cell : headerRow) {
            String header = cell.getStringCellValue().toUpperCase().trim()
                .replaceAll("[^A-Z0-9 ]", "");
            
            for (Map.Entry<String, String[]> entry : aliases.entrySet()) {
                for (String alias : entry.getValue()) {
                    if (header.contains(alias)) {
                        columns.put(entry.getKey(), cell.getColumnIndex());
                        break;
                    }
                }
            }
        }
        
        return columns;
    }

    private String getCellValue(Row row, Integer columnIndex) {
        if (columnIndex == null) return null;
        Cell cell = row.getCell(columnIndex);
        if (cell == null) return null;
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                double numValue = cell.getNumericCellValue();
                yield numValue == Math.floor(numValue) 
                    ? String.valueOf((long) numValue) 
                    : String.valueOf(numValue);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
    }

    private boolean isEmptyRow(Row row) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValue(row, i);
                if (value != null && !value.isBlank()) return false;
            }
        }
        return true;
    }

    private costCenter parseCostCenter(String value) {
        if (value == null || value.isBlank()) return costCenter.PAC;
        
        String normalized = value.toUpperCase().trim()
            .replaceAll("[^A-Z_]", "_")
            .replaceAll("_+", "_");
        
        try {
            return costCenter.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Tentar por display name
            for (costCenter cc : costCenter.values()) {
                if (cc.getDisplayName().equalsIgnoreCase(value.trim())) {
                    return cc;
                }
            }
            return costCenter.PAC;
        }
    }

    private HardwareStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return HardwareStatus.ACTIVE;
        
        String normalized = value.toUpperCase().trim()
            .replaceAll("[^A-Z_]", "_")
            .replaceAll("_+", "_");
        
        try {
            return HardwareStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Mapeamento manual de variações
            return switch (value.toUpperCase().trim()) {
                case "ATIVO", "EM USO" -> HardwareStatus.ACTIVE;
                case "INATIVO", "ESTOQUE" -> HardwareStatus.INACTIVE;
                case "MANUTENCAO", "MANUTENÇÃO", "EM MANUTENCAO" -> HardwareStatus.MAINTENANCE;
                case "BACKUP" -> HardwareStatus.BACKUP;
                case "REVERSE", "COLETA", "EM COLETA" -> HardwareStatus.REVERSE;
                default -> HardwareStatus.ACTIVE;
            };
        }
    }

    private Double parsePrice(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            // Remover R$, pontos e trocar vírgula por ponto
            String cleaned = value.replace("R$", "")
                .replace(".", "")
                .replace(",", ".")
                .trim();
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}