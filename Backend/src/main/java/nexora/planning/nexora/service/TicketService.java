package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.TicketRequestDTO;
import nexora.planning.nexora.dto.TicketResponseDTO;
import nexora.planning.nexora.dto.TicketUpdateDTO;
import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketStatus;
import nexora.planning.nexora.model.*;
import nexora.planning.nexora.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository       ticketRepo;
    private final TicketHistoryRepository historyRepo;
    private final UserRepository         userRepo;
    private final DocCatalogService      docCatalog;

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponseDTO create(TicketRequestDTO req, String requesterUsername) {
        User requester = findUser(requesterUsername);

        // Valida campos DOC
        if (req.getDestDepartment() == DestDepartment.DOC) {
            if (req.getProcessId() == null || req.getStepId() == null)
                throw new IllegalArgumentException("Processo e etapa são obrigatórios para chamados DOC.");
        }

        Ticket ticket = Ticket.builder()
            .number(generateNumber())
            .title(req.getTitle())
            .description(req.getDescription())
            .priority(req.getPriority())
            .status(TicketStatus.NOVO)
            .destDepartment(req.getDestDepartment())
            .requester(requester)
            .sourceRoute(req.getSourceRoute())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        // Detalhe DOC
        if (req.getDestDepartment() == DestDepartment.DOC) {
            DocProcess proc = docCatalog.requireProcess(req.getProcessId());
            DocStep    step = docCatalog.requireStep(req.getStepId());

            DocTicketDetail detail = DocTicketDetail.builder()
                .ticket(ticket)
                .process(proc)
                .step(step)
                .companyName(req.getCompanyName())
                .companyCnpj(req.getCompanyCnpj())
                .emailDestination(req.getEmailDestination())
                .extraData(req.getExtraData())
                .build();
            ticket.setDocDetail(detail);
        }

        Ticket saved = ticketRepo.save(ticket);

        // Histórico de abertura
        addHistory(saved, requester, null, null, null, "Chamado aberto.");

        log.info("Ticket criado: {} por {}", saved.getNumber(), requesterUsername);
        return TicketResponseDTO.from(saved);
    }

    // ── Listagens ─────────────────────────────────────────────────────────────

    /** Colaborador vê apenas os próprios chamados. */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listMine(String username, Pageable pageable) {
        User u = findUser(username);
        return ticketRepo.findByRequester(u, pageable).map(TicketResponseDTO::from);
    }

    /** Equipe vê os chamados recebidos pelo seu departamento. */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listByDept(DestDepartment dept, Pageable pageable) {
        return ticketRepo.findByDestDepartment(dept, pageable).map(TicketResponseDTO::from);
    }

    /** TI / Admin: visão global com filtros opcionais. */
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> listAll(DestDepartment dept, TicketStatus status, Pageable pageable) {
        return ticketRepo.search(dept, status, pageable).map(TicketResponseDTO::from);
    }

    /** Detalhe de um ticket pelo número amigável. */
    @Transactional(readOnly = true)
    public TicketResponseDTO getByNumber(String number) {
        Ticket t = ticketRepo.findByNumber(number)
            .orElseThrow(() -> new IllegalArgumentException("Chamado não encontrado: " + number));
        return TicketResponseDTO.from(t);
    }

    /** Detalhe por id. */
    @Transactional(readOnly = true)
    public TicketResponseDTO getById(Long id) {
        return TicketResponseDTO.from(findTicket(id));
    }

    // ── Atualização de status / responsável ───────────────────────────────────

    @Transactional
    public TicketResponseDTO update(Long ticketId, TicketUpdateDTO dto, String operatorUsername) {
        Ticket  ticket   = findTicket(ticketId);
        User    operator = findUser(operatorUsername);

        if (dto.getStatus() != null && dto.getStatus() != ticket.getStatus()) {
            TicketStatus old = ticket.getStatus();
            ticket.setStatus(dto.getStatus());
            if (dto.getStatus() == TicketStatus.RESOLVIDO || dto.getStatus() == TicketStatus.CANCELADO)
                ticket.setClosedAt(LocalDateTime.now());
            addHistory(ticket, operator, "status", old.name(), dto.getStatus().name(), dto.getNote());
        }

        if (dto.getAssigneeId() != null) {
            User assignee = findUser(dto.getAssigneeId());
            String oldAssignee = ticket.getAssignee() != null ? ticket.getAssignee().getFullName() : "Nenhum";
            ticket.setAssignee(assignee);
            addHistory(ticket, operator, "assignee", oldAssignee, assignee.getFullName(), null);
        }

        if (dto.getNote() != null && !dto.getNote().isBlank() && dto.getStatus() == null && dto.getAssigneeId() == null) {
            addHistory(ticket, operator, null, null, null, dto.getNote());
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponseDTO.from(ticketRepo.save(ticket));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateNumber() {
        long seq = ticketRepo.count() + 1;
        return String.format("TKT-%d-%05d", Year.now().getValue(), seq);
    }

    private void addHistory(Ticket t, User by, String field,
                            String oldVal, String newVal, String note) {
        TicketHistory h = TicketHistory.builder()
            .ticket(t)
            .changedBy(by)
            .fieldName(field)
            .oldValue(oldVal)
            .newValue(newVal)
            .note(note)
            .changedAt(LocalDateTime.now())
            .build();
        historyRepo.save(h);
    }

    private Ticket findTicket(Long id) {
        return ticketRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Chamado não encontrado: " + id));
    }

    private User findUser(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + username));
    }

    private User findUser(Long id) {
        return userRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
    }
}
