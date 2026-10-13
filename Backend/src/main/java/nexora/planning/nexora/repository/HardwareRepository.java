package nexora.planning.nexora.repository;

import nexora.planning.nexora.repository.NotebookRepository;
import nexora.planning.nexora.repository.MonitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Verifica unicidade de número de série entre notebooks e monitors.
 * Não usa herança JPA — delega para cada repositório individual.
 */
@Component
@RequiredArgsConstructor
public class HardwareRepository {

    private final NotebookRepository notebookRepository;
    private final MonitorRepository  monitorRepository;

    public boolean existsBySerialNumber(String serialNumber) {
        return notebookRepository.existsBySerialNumber(serialNumber)
            || monitorRepository.existsBySerialNumber(serialNumber);
    }
}
