package nexora.planning.nexora.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doc_steps",
       uniqueConstraints = @UniqueConstraint(columnNames = {"process_id", "code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private DocProcess process;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false)
    private String name;

    /** Orientação da coluna "Informar" da planilha DOC. */
    @Column(name = "inform_text", columnDefinition = "TEXT")
    private String informText;

    @Column(name = "requires_company", nullable = false)
    @Builder.Default
    private boolean requiresCompany = false;

    @Column(name = "requires_documents", nullable = false)
    @Builder.Default
    private boolean requiresDocuments = false;

    /** Indica etapa "Email com Endereço Livre para Digitação" — exige campo de email no formulário. */
    @Column(name = "requires_email_address", nullable = false)
    @Builder.Default
    private boolean requiresEmailAddress = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
