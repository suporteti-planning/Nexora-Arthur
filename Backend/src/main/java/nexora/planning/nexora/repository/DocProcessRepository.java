package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.DocProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DocProcessRepository extends JpaRepository<DocProcess, Long> {

    Optional<DocProcess> findByCode(String code);

    List<DocProcess> findByActiveTrueOrderBySortOrderAsc();

    @Query("SELECT p FROM DocProcess p LEFT JOIN FETCH p.steps s " +
           "WHERE p.active = true AND (s.active = true OR s IS NULL) " +
           "ORDER BY p.sortOrder ASC")
    List<DocProcess> findAllActiveWithSteps();
}
