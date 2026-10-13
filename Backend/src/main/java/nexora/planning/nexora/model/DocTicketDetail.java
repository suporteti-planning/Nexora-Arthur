package nexora.planning.nexora.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;

@Entity
@Table(name = "doc_ticket_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocTicketDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DocProcess process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DocStep step;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_cnpj", length = 20)
    private String companyCnpj;

    /** E-mail de destino para etapas "Email com Endereço Livre para Digitação". */
    @Column(name = "email_destination", length = 255)
    private String emailDestination;

    /** Descrição complementar da requisição. */
    @Column(name = "description_text", columnDefinition = "TEXT")
    private String descriptionText;

    /** Dados complementares dinâmicos por etapa (JSONB). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra_data", columnDefinition = "jsonb")
    private Map<String, Object> extraData;
}
