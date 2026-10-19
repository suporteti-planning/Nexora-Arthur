package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TicketPriority;
import nexora.planning.nexora.enums.TicketStatus;
import nexora.planning.nexora.model.Ticket;
import nexora.planning.nexora.model.TicketAttachment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class TicketResponseDTO {
    private Long            id;
    private String          number;
    private String          title;
    private String          description;
    private TicketPriority  priority;
    private TicketStatus    status;
    private DestDepartment  destDepartment;
    private String          destDepartmentName;
    private UserSummaryDTO  requester;
    private UserSummaryDTO  assignee;
    private LocalDateTime   createdAt;
    private LocalDateTime   updatedAt;
    private LocalDateTime   closedAt;
    private String          sourceRoute;
    private DocDetailDTO    docDetail;
    private List<HistoryDTO>    history;
    private List<AttachmentDTO> attachments;

    public static TicketResponseDTO from(Ticket t) {
        return TicketResponseDTO.builder()
            .id(t.getId())
            .number(t.getNumber())
            .title(t.getTitle())
            .description(t.getDescription())
            .priority(t.getPriority())
            .status(t.getStatus())
            .destDepartment(t.getDestDepartment())
            .destDepartmentName(t.getDestDepartment() != null ? t.getDestDepartment().getDisplayName() : null)
            .requester(t.getRequester() != null ? UserSummaryDTO.from(t.getRequester()) : null)
            .assignee(t.getAssignee()   != null ? UserSummaryDTO.from(t.getAssignee())  : null)
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .closedAt(t.getClosedAt())
            .sourceRoute(t.getSourceRoute())
            .docDetail(t.getDocDetail() != null ? DocDetailDTO.from(t.getDocDetail()) : null)
            .history(t.getHistory() == null ? List.of() :
                t.getHistory().stream().map(HistoryDTO::from).collect(Collectors.toList()))
            .attachments(t.getAttachments() == null ? List.of() :
                t.getAttachments().stream().map(AttachmentDTO::from).collect(Collectors.toList()))
            .build();
    }

    // ── Inner DTOs ────────────────────────────────────────────────────────────

    @Data @Builder
    public static class UserSummaryDTO {
        private Long   id;
        private String username;
        private String fullName;
        private String email;

        public static UserSummaryDTO from(nexora.planning.nexora.model.User u) {
            return UserSummaryDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .build();
        }
    }

    @Data @Builder
    public static class DocDetailDTO {
        private Long   processId;
        private String processName;
        private Long   stepId;
        private String stepName;
        private boolean requiresEmailAddress;
        private String informText;
        private String companyName;
        private String companyCnpj;
        private String emailDestination;
        private String descriptionText;
        private java.util.Map<String, Object> extraData;

        public static DocDetailDTO from(nexora.planning.nexora.model.DocTicketDetail d) {
            return DocDetailDTO.builder()
                .processId(d.getProcess() != null ? d.getProcess().getId() : null)
                .processName(d.getProcess() != null ? d.getProcess().getName() : null)
                .stepId(d.getStep() != null ? d.getStep().getId() : null)
                .stepName(d.getStep() != null ? d.getStep().getName() : null)
                .requiresEmailAddress(d.getStep() != null && d.getStep().isRequiresEmailAddress())
                .informText(d.getStep() != null ? d.getStep().getInformText() : null)
                .companyName(d.getCompanyName())
                .companyCnpj(d.getCompanyCnpj())
                .emailDestination(d.getEmailDestination())
                .descriptionText(d.getDescriptionText())
                .extraData(d.getExtraData())
                .build();
        }
    }

    @Data @Builder
    public static class HistoryDTO {
        private Long          id;
        private String        changedByName;
        private String        fieldName;
        private String        oldValue;
        private String        newValue;
        private String        note;
        private LocalDateTime changedAt;

        public static HistoryDTO from(nexora.planning.nexora.model.TicketHistory h) {
            return HistoryDTO.builder()
                .id(h.getId())
                .changedByName(h.getChangedBy() != null ? h.getChangedBy().getFullName() : null)
                .fieldName(h.getFieldName())
                .oldValue(h.getOldValue())
                .newValue(h.getNewValue())
                .note(h.getNote())
                .changedAt(h.getChangedAt())
                .build();
        }
    }

    @Data @Builder
    public static class AttachmentDTO {
        private Long          id;
        private String        fileName;
        private String        contentType;
        private Long          fileSize;
        private LocalDateTime uploadedAt;
        /** URL relativa para download via /api/tickets/attachments/{id}/download */
        private String        downloadUrl;

        public static AttachmentDTO from(TicketAttachment a) {
            return AttachmentDTO.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .contentType(a.getContentType())
                .fileSize(a.getFileSize())
                .uploadedAt(a.getUploadedAt())
                .downloadUrl("/api/tickets/attachments/" + a.getId() + "/download")
                .build();
        }
    }
}
