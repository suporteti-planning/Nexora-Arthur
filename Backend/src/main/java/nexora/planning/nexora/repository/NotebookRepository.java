package nexora.planning.nexora.repository;

import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.NotebookStatus;
import nexora.planning.nexora.model.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotebookRepository extends JpaRepository<Notebook, Long> {
    Optional<Notebook> findByName(String name);
    Optional<Notebook> findBySerialNumber(String serialNumber);
    Optional<Notebook> findByEmployeeId(Long employeeId);
    boolean existsBySerialNumber(String serialNumber);
    List<Notebook> findByCostCenter(costCenter costCenter);
    List<Notebook> findByEmployeeIsNull();
    List<Notebook> findByStatus(NotebookStatus status);
    Optional<Notebook> findByPrice(Double price);
}