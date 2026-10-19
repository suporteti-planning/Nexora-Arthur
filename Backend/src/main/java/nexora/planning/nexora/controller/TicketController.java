package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.TicketRequestDTO;
import nexora.planning.nexora.dto.TicketResponseDTO;
import nexora.planning.nexora.dto.TicketUpdateDTO;
import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketStatus;
import nexora.planning.nexora.model.TicketAttachment;
import nexora.planning.nexora.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService service;

    // ── Criação ───────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> create(
            @Valid @RequestBody TicketRequestDTO req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(req, auth.getName()));
    }

    // ── Meus chamados ─────────────────────────────────────────────────────────

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TicketResponseDTO>> mine(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listMine(
            auth.getName(),
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // ── Fila da equipe ────────────────────────────────────────────────────────

    @GetMapping("/dept/{dept}")
    @PreAuthorize("hasAnyRole('TI','ADMIN','DOC','RH','DP','FINANCEIRO','RISCO','DEMO')")
    public ResponseEntity<Page<TicketResponseDTO>> byDept(
            @PathVariable DestDepartment dept,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listByDept(
            dept,
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // ── Visão global — TI, Admin e Demo ──────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('TI','ADMIN','DEMO')")
    public ResponseEntity<Page<TicketResponseDTO>> listAll(
            @RequestParam(required = false) DestDepartment dept,
            @RequestParam(required = false) TicketStatus   status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(service.listAll(
            dept, status,
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // ── Detalhe ───────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/number/{number}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> getByNumber(@PathVariable String number) {
        return ResponseEntity.ok(service.getByNumber(number));
    }

    // ── Atualização ───────────────────────────────────────────────────────────

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TI','ADMIN','DOC','RH','DP','FINANCEIRO','RISCO','DEMO')")
    public ResponseEntity<TicketResponseDTO> update(
            @PathVariable Long id,
            @RequestBody TicketUpdateDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(service.update(id, dto, auth.getName()));
    }

    // ── Anexos ────────────────────────────────────────────────────────────────

    /**
     * POST /api/tickets/{id}/attachments
     * Recebe um ou mais arquivos e os vincula ao chamado.
     * Tamanho máximo configurável via spring.servlet.multipart.max-file-size.
     */
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponseDTO.AttachmentDTO>> uploadAttachments(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addAttachments(id, files, auth.getName()));
    }

    /**
     * GET /api/tickets/{id}/attachments
     * Lista os metadados dos anexos do chamado.
     */
    @GetMapping("/{id}/attachments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponseDTO.AttachmentDTO>> listAttachments(
            @PathVariable Long id) {
        return ResponseEntity.ok(service.listAttachments(id));
    }

    /**
     * GET /api/tickets/attachments/{attachId}/download
     * Serve o arquivo binário para visualização/download.
     */
    @GetMapping("/attachments/{attachId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long attachId) {
        TicketAttachment att = service.requireAttachment(attachId);
        Resource resource = new PathResource(Paths.get(att.getFilePath()));

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = att.getContentType() != null
            ? att.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        // Para tipos visualizáveis no browser (PDF, imagens) usa inline;
        // para demais formatos força download.
        boolean inlineable = contentType.startsWith("image/") || contentType.equals("application/pdf");
        String disposition = (inlineable ? "inline" : "attachment")
            + "; filename*=UTF-8''"
            + URLEncoder.encode(att.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
            .body(resource);
    }
}
