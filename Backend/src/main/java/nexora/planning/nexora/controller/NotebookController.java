package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.NotebookRequestDTO;
import nexora.planning.nexora.dto.NotebookResponseDTO;
import nexora.planning.nexora.dto.NotebookImportResultDTO;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.service.NotebookService;
import nexora.planning.nexora.service.NotebookImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.ByteArrayOutputStream;
import java.io.IOException;


import java.util.List;

@RestController
@RequestMapping("/api/notebooks")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookService notebookService;
    private final NotebookImportService notebookImportService;

    @GetMapping
    public ResponseEntity<List<NotebookResponseDTO>> getAll() {
        return ResponseEntity.ok(notebookService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotebookResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(notebookService.findById(id));
    }

    @GetMapping("/cost-center/{costCenter}")
    public ResponseEntity<List<NotebookResponseDTO>> getByCostCenter(@PathVariable costCenter costCenter) {
        return ResponseEntity.ok(notebookService.findByCostCenter(costCenter));
    }

    @GetMapping("/available")
    public ResponseEntity<List<NotebookResponseDTO>> getAvailable() {
        return ResponseEntity.ok(notebookService.findAvailable());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<NotebookResponseDTO>> getByStatus(@PathVariable HardwareStatus status) {
        return ResponseEntity.ok(notebookService.findByStatus(status));
    }

    @GetMapping("/price/{price}")
    public ResponseEntity<List<NotebookResponseDTO>> getByPrice(@PathVariable Double price) {
        return ResponseEntity.ok(notebookService.findByPrice(price));
    }

    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Notebooks");

            String[] headers = {
                "Nome", "Marca", "Modelo", "Serial", "Processador", 
                "RAM", "Armazenamento", "Sistema Operacional", 
                "Observações", "Centro de Custo", "Status", "Email", "Preço"
            };

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("NTB-000");
            exampleRow.createCell(1).setCellValue("Dell");
            exampleRow.createCell(2).setCellValue("Latitude 3520");
            exampleRow.createCell(3).setCellValue("ABC123456");
            exampleRow.createCell(4).setCellValue("Intel Core i5");
            exampleRow.createCell(5).setCellValue("16GB");
            exampleRow.createCell(6).setCellValue("256GB");
            exampleRow.createCell(7).setCellValue("Windows 11 Pro");
            exampleRow.createCell(8).setCellValue("observação");
            exampleRow.createCell(9).setCellValue("PAC");
            exampleRow.createCell(10).setCellValue("ATIVO");
            exampleRow.createCell(11).setCellValue("colaborador@planning.com.br");
            exampleRow.createCell(12).setCellValue(3500.00);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            responseHeaders.setContentDispositionFormData("Attachment", "modelo-notebooks.xlsx");

            return ResponseEntity.ok().headers(responseHeaders).body(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao gerar planilha modelo", e);
        }
    }

    @PostMapping
    public ResponseEntity<NotebookResponseDTO> create(@Valid @RequestBody NotebookRequestDTO requestDTO) {
        NotebookResponseDTO created = notebookService.create(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{notebookId}/assign/{employeeId}")
    public ResponseEntity<NotebookResponseDTO> assignEmployee(
            @PathVariable Long notebookId, 
            @PathVariable Long employeeId) {
        NotebookResponseDTO assigned = notebookService.assignEmployee(notebookId, employeeId);
        return ResponseEntity.ok(assigned);
    }

    @PostMapping("/assign-by-email")
    public ResponseEntity<NotebookResponseDTO> assignByEmail(
        @RequestParam String notebookName,
        @RequestParam String employeeEmail) {
            NotebookResponseDTO assigned = notebookService.assignByEmail(notebookName, employeeEmail);
            return ResponseEntity.ok(assigned);
    }

    @PostMapping("/import")
    public ResponseEntity<NotebookImportResultDTO> importNotebooks(@RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            NotebookImportResultDTO error = new NotebookImportResultDTO();
            error.setSuccess(false);
            error.setMessage("Arquivo vazio.");
            return ResponseEntity.badRequest().body(error);
        }

        NotebookImportResultDTO result = notebookImportService.importFromExcel(file);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NotebookResponseDTO> update(@PathVariable Long id, @Valid @RequestBody NotebookRequestDTO requestDTO) {
        NotebookResponseDTO updated = notebookService.update(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notebookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}