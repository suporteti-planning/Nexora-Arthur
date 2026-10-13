package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.DocProcessDTO;
import nexora.planning.nexora.dto.DocStepDTO;
import nexora.planning.nexora.model.DocProcess;
import nexora.planning.nexora.model.DocStep;
import nexora.planning.nexora.repository.DocProcessRepository;
import nexora.planning.nexora.repository.DocStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocCatalogService {

    private final DocProcessRepository processRepo;
    private final DocStepRepository    stepRepo;

    // ── Processos ─────────────────────────────────────────────────────────────

    /** Lista todos os processos ativos com suas etapas (para o formulário DOC). */
    public List<DocProcessDTO> listAllWithSteps() {
        return processRepo.findAllActiveWithSteps()
            .stream()
            .map(DocProcessDTO::from)
            .collect(Collectors.toList());
    }

    /** Lista processos sem carregar etapas (seletor de tipo). */
    public List<DocProcessDTO> listSummaries() {
        return processRepo.findByActiveTrueOrderBySortOrderAsc()
            .stream()
            .map(DocProcessDTO::summary)
            .collect(Collectors.toList());
    }

    /** Retorna um processo com todas as etapas pelo id. */
    public DocProcessDTO getProcessById(Long id) {
        DocProcess p = processRepo.findById(id)
            .filter(DocProcess::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Processo não encontrado: " + id));
        return DocProcessDTO.from(p);
    }

    // ── Etapas ────────────────────────────────────────────────────────────────

    /** Lista etapas ativas de um processo. */
    public List<DocStepDTO> listStepsByProcess(Long processId) {
        return stepRepo.findByProcessIdAndActiveTrueOrderBySortOrderAsc(processId)
            .stream()
            .map(DocStepDTO::from)
            .collect(Collectors.toList());
    }

    /** Busca uma etapa pelo id, valida que pertence ao processo. */
    public DocStepDTO getStep(Long stepId, Long processId) {
        DocStep s = stepRepo.findById(stepId)
            .orElseThrow(() -> new IllegalArgumentException("Etapa não encontrada: " + stepId));
        if (!s.getProcess().getId().equals(processId)) {
            throw new IllegalArgumentException("Etapa não pertence ao processo informado.");
        }
        return DocStepDTO.from(s);
    }

    // ── Internos ──────────────────────────────────────────────────────────────

    DocProcess requireProcess(Long id) {
        return processRepo.findById(id)
            .filter(DocProcess::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Processo não encontrado: " + id));
    }

    DocStep requireStep(Long id) {
        return stepRepo.findById(id)
            .filter(DocStep::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Etapa não encontrada: " + id));
    }
}
