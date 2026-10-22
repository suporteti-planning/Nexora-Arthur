package nexora.planning.nexora.dto;

import nexora.planning.nexora.model.DocStep;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocStepDTO {
    private Long    id;
    private String  code;
    private String  name;
    private String  informText;
    private boolean requiresCompany;
    private boolean requiresDocuments;
    private boolean requiresEmailAddress;
    private int     sortOrder;

    public static DocStepDTO from(DocStep s) {
        return DocStepDTO.builder()
            .id(s.getId())
            .code(s.getCode())
            .name(s.getName())
            .informText(s.getInformText())
            .requiresCompany(s.isRequiresCompany())
            .requiresDocuments(s.isRequiresDocuments())
            .requiresEmailAddress(s.isRequiresEmailAddress())
            .sortOrder(s.getSortOrder())
            .build();
    }
}
