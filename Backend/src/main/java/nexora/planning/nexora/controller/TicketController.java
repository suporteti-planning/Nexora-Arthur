package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.TicketRequestDTO;
import nexora.planning.nexora.dto.TicketResponseDTO;
import nexora.planning.nexora.dto.TicketUpdateDTO;
import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketStatus;
import nexora.planning.nexora.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService service;

    // ── Criação — qualquer usuário autenticado ────────────────────────────────

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

    // ── Fila da equipe (DOC, RH, DP, FINANCEIRO, RISCO, TI) ──────────────────

    @GetMapping("/dept/{dept}")
    @PreAuthorize("hasAnyRole('TI','ADMIN','DOC','RH','DP','FINANCEIRO','RISCO')")
    public ResponseEntity<Page<TicketResponseDTO>> byDept(
            @PathVariable DestDepartment dept,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listByDept(
            dept,
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    // ── Visão global — TI e Admin ─────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('TI','ADMIN')")
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

    // ── Atualização — equipes e TI ────────────────────────────────────────────

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TI','ADMIN','DOC','RH','DP','FINANCEIRO','RISCO')")
    public ResponseEntity<TicketResponseDTO> update(
            @PathVariable Long id,
            @RequestBody TicketUpdateDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(service.update(id, dto, auth.getName()));
    }
}
