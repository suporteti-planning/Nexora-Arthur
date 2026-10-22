package nexora.planning.nexora.repository;

import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.model.Monitor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MonitorRepository extends JpaRepository<Monitor, Long> {
    List<Monitor> findByStatus(HardwareStatus status);
}
