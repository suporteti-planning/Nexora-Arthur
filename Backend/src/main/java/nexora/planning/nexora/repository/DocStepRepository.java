package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.DocStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocStepRepository extends JpaRepository<DocStep, Long> {

    List<DocStep> findByProcessIdAndActiveTrueOrderBySortOrderAsc(Long processId);

    boolean existsByProcessIdAndCode(Long processId, String code);
}
