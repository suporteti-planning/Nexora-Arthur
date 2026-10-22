package nexora.planning.nexora.repository;

import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketStatus;
import nexora.planning.nexora.model.Ticket;
import nexora.planning.nexora.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByNumber(String number);

    // ── Consultas por solicitante (colaborador vê os próprios) ───────────────
    Page<Ticket> findByRequester(User requester, Pageable pageable);
    List<Ticket> findByRequesterOrderByCreatedAtDesc(User requester);

    // ── Consultas por departamento destinatário (equipe vê os recebidos) ─────
    Page<Ticket> findByDestDepartment(DestDepartment dept, Pageable pageable);
    List<Ticket> findByDestDepartmentAndStatusIn(DestDepartment dept, List<TicketStatus> statuses);

    // ── Consultas globais (TI / Admin) ────────────────────────────────────────
    Page<Ticket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
        SELECT t FROM Ticket t
        WHERE (:dept IS NULL OR t.destDepartment = :dept)
          AND (:status IS NULL OR t.status = :status)
        ORDER BY t.createdAt DESC
    """)
    Page<Ticket> search(
        @Param("dept")   DestDepartment dept,
        @Param("status") TicketStatus status,
        Pageable pageable
    );

    // ── Contagem por status e departamento ────────────────────────────────────
    long countByDestDepartmentAndStatus(DestDepartment dept, TicketStatus status);
    long countByRequesterAndStatus(User requester, TicketStatus status);
}
