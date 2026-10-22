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
@Transactional
public class DocCatalogService {

    private final DocProcessRepository processRepo;
    private final DocStepRepository    stepRepo;

    // ── Processos ─────────────────────────────────────────────────────────────

    public List<DocProcessDTO> listAllWithSteps() {
        return processRepo.findAllActiveWithSteps()
            .stream()
            .map(DocProcessDTO::from)
            .collect(Collectors.toList());
    }

    public List<DocProcessDTO> listSummaries() {
        return processRepo.findByActiveTrueOrderBySortOrderAsc()
            .stream()
            .map(DocProcessDTO::summary)
            .collect(Collectors.toList());
    }

    public DocProcessDTO getProcessById(Long id) {
        DocProcess p = processRepo.findById(id)
            .filter(DocProcess::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Processo não encontrado: " + id));
        return DocProcessDTO.from(p);
    }

    // ── Escrita (usado apenas pelo seeder) ────────────────────────────────────

    /** Cria um processo com etapas. Idempotente por code. */
    @Transactional
    public DocProcessDTO createProcess(DocProcessDTO dto) {
        if (dto.getCode() == null || dto.getCode().isBlank()) {
            throw new IllegalArgumentException("code obrigatório: " + dto.getName());
        }

        var existing = processRepo.findByCode(dto.getCode());
        if (existing.isPresent()) {
            log.debug("Processo DOC {} já existe, ignorando.", dto.getCode());
            return DocProcessDTO.from(existing.get());
        }

        DocProcess process = DocProcess.builder()
            .code(dto.getCode())
            .name(dto.getName())
            .description(dto.getDescription())
            .sortOrder(dto.getSortOrder())
            .active(true)
            .build();

        int order = 1;
        for (DocStepDTO s : dto.getSteps()) {
            if (s.getCode() == null || s.getCode().isBlank()) {
                throw new IllegalArgumentException("code obrigatório na etapa: " + s.getName());
            }
            DocStep step = DocStep.builder()
                .code(s.getCode())
                .name(s.getName())
                .informText(s.getInformText())
                .requiresCompany(s.isRequiresCompany())
                .requiresDocuments(s.isRequiresDocuments())
                .requiresEmailAddress(s.isRequiresEmailAddress())
                .sortOrder(s.getSortOrder() > 0 ? s.getSortOrder() : order)
                .active(true)
                .process(process)
                .build();
            process.getSteps().add(step);
            order++;
        }

        DocProcess saved = processRepo.save(process);
        log.info("Processo DOC criado: {} ({} etapas)", saved.getName(), saved.getSteps().size());
        return DocProcessDTO.from(saved);
    }

    // ── Etapas ────────────────────────────────────────────────────────────────

    public List<DocStepDTO> listStepsByProcess(Long processId) {
        return stepRepo.findByProcessIdAndActiveTrueOrderBySortOrderAsc(processId)
            .stream()
            .map(DocStepDTO::from)
            .collect(Collectors.toList());
    }

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