package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.DocProcessDTO;
import nexora.planning.nexora.dto.DocStepDTO;
import nexora.planning.nexora.service.DocCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo DOC — acessível a qualquer usuário autenticado.
 * Os dados do catálogo não são sensíveis; apenas a criação de chamados exige autorização.
 */
@RestController
@RequestMapping("/api/doc/catalog")
@RequiredArgsConstructor
public class DocCatalogController {

    private final DocCatalogService service;

    /** Lista todos os processos ativos com etapas (para o formulário). */
    @GetMapping("/processes")
    public ResponseEntity<List<DocProcessDTO>> listAll() {
        return ResponseEntity.ok(service.listAllWithSteps());
    }

    /** Lista somente os processos (sem etapas — para o seletor de tipo). */
    @GetMapping("/processes/summary")
    public ResponseEntity<List<DocProcessDTO>> listSummary() {
        return ResponseEntity.ok(service.listSummaries());
    }

    /** Processo específico com etapas. */
    @GetMapping("/processes/{id}")
    public ResponseEntity<DocProcessDTO> getProcess(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProcessById(id));
    }

    /** Etapas de um processo (para carregamento dinâmico no formulário). */
    @GetMapping("/processes/{processId}/steps")
    public ResponseEntity<List<DocStepDTO>> listSteps(@PathVariable Long processId) {
        return ResponseEntity.ok(service.listStepsByProcess(processId));
    }

    /** Etapa específica com seu inform_text. */
    @GetMapping("/processes/{processId}/steps/{stepId}")
    public ResponseEntity<DocStepDTO> getStep(@PathVariable Long processId,
                                              @PathVariable Long stepId) {
        return ResponseEntity.ok(service.getStep(stepId, processId));
    }
}
