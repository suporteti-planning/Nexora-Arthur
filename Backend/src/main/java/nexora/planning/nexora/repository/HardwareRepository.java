package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.Hardware;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HardwareRepository extends JpaRepository<Hardware, Long> {
    boolean existsBySerialNumber(String serialNumber);
}
