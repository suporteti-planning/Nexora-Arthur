package nexora.planning.nexora.dto;

import nexora.planning.nexora.model.DocProcess;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class DocProcessDTO {
    private Long            id;
    private String          code;
    private String          name;
    private String          description;
    private int             sortOrder;
    private List<DocStepDTO> steps;

    public static DocProcessDTO from(DocProcess p) {
        return DocProcessDTO.builder()
            .id(p.getId())
            .code(p.getCode())
            .name(p.getName())
            .description(p.getDescription())
            .sortOrder(p.getSortOrder())
            .steps(p.getSteps() == null ? List.of() :
                p.getSteps().stream()
                    .filter(nexora.planning.nexora.model.DocStep::isActive)
                    .map(DocStepDTO::from)
                    .collect(Collectors.toList()))
            .build();
    }

    /** Versão sem etapas (para listagens leves). */
    public static DocProcessDTO summary(DocProcess p) {
        return DocProcessDTO.builder()
            .id(p.getId())
            .code(p.getCode())
            .name(p.getName())
            .sortOrder(p.getSortOrder())
            .steps(List.of())
            .build();
    }
}
