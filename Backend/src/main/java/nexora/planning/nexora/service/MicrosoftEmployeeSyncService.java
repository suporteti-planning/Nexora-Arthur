package nexora.planning.nexora.service;

import com.microsoft.graph.models.User;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.util.MicrosoftDepartmentFormatter;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class MicrosoftEmployeeSyncService {

    private final GraphServiceClient graphClient;
    private final MicrosoftLicenseService microsoftLicenseService;

    public void synchronizeChanges(Employee previous, Employee updated) {
        log.info("=== INICIANDO SINCRONIZAÇÃO COM MICROSOFT ===");
        log.info("Previous: name={}, position={}, department={}, leader={}, costCenter={}, status={}",
            previous.getName(), previous.getPosition(), previous.getDepartment(),
            previous.getLeader(), previous.getCostCenter(), previous.getStatus());
        log.info("Updated:  name={}, position={}, department={}, leader={}, costCenter={}, status={}",
            updated.getName(), updated.getPosition(), updated.getDepartment(),
            updated.getLeader(), updated.getCostCenter(), updated.getStatus());
        log.info("Microsoft ID: {}", updated.getMicrosoftId());

        boolean licensesChanged = !licenses(previous).equals(licenses(updated));
        boolean profileChanged = !same(previous.getName(), updated.getName())
            || !same(previous.getPosition(), updated.getPosition())
            || !same(previous.getDepartment(), updated.getDepartment())
            || !same(previous.getLeader(), updated.getLeader())
            || previous.getCostCenter() != updated.getCostCenter()
            || previous.getStatus() != updated.getStatus();

        log.info("licensesChanged={}, profileChanged={}", licensesChanged, profileChanged);

        if (!licensesChanged && !profileChanged) {
            log.info("Nenhuma alteração detectada, nada a sincronizar");
            return;
        }

        String microsoftId = updated.getMicrosoftId();
        if (microsoftId == null || microsoftId.isBlank()) {
            log.warn("Colaborador não possui Microsoft ID vinculado");
            if (licensesChanged) {
                throw new IllegalStateException("Não é possível sincronizar licenças: este colaborador não está vinculado a uma conta Microsoft.");
            }
            return;
        }
        if (graphClient == null) {
            throw new IllegalStateException("Microsoft Graph não está configurado; as alterações não foram sincronizadas.");
        }

        // Sincronizar licenças
        if (licensesChanged) {
            log.info("Sincronizando licenças: {}", licenses(updated));
            microsoftLicenseService.syncUserLicenses(microsoftId, licenses(updated));
        }

        if (!profileChanged) {
            log.info("Nenhuma alteração de perfil, apenas licenças");
            return;
        }

        // Construir objeto de atualização
        User graphUpdate = new User();

        // Nome
        if (!same(previous.getName(), updated.getName())) {
            String fullName = updated.getName() == null ? "" : updated.getName().trim();
            String[] nameParts = fullName.split("\\s+", 2);
            graphUpdate.setDisplayName(fullName);
            graphUpdate.setGivenName(nameParts.length > 0 ? nameParts[0] : "");
            graphUpdate.setSurname(nameParts.length > 1 ? nameParts[1] : "");
            log.info("Nome alterado: '{}' -> '{}'", previous.getName(), updated.getName());
        }

        // Cargo
        if (!same(previous.getPosition(), updated.getPosition())) {
            graphUpdate.setJobTitle(updated.getPosition());
            log.info("Cargo alterado: '{}' -> '{}'", previous.getPosition(), updated.getPosition());
        }

        // Departamento: sempre que department OU leader mudarem, reenvia o formatado
        if (!same(previous.getDepartment(), updated.getDepartment())
                || !same(previous.getLeader(), updated.getLeader())) {
            String formattedDepartment = MicrosoftDepartmentFormatter.format(
                updated.getDepartment(),
                updated.getLeader()
            );
            graphUpdate.setDepartment(formattedDepartment);
            log.info("Departamento formatado para envio: '{}'", formattedDepartment);
        }

        // Centro de custo
        if (previous.getCostCenter() != updated.getCostCenter() && updated.getCostCenter() != null) {
            graphUpdate.setState(updated.getCostCenter().name());
            log.info("Centro de custo alterado: '{}' -> '{}'", previous.getCostCenter(), updated.getCostCenter());
        }

        // Status
        if (previous.getStatus() != updated.getStatus() && updated.getStatus() != null) {
            boolean isActive = "ACTIVE".equals(updated.getStatus().name());
            graphUpdate.setAccountEnabled(isActive);
            log.info("Status alterado: '{}' -> '{}'", previous.getStatus(), updated.getStatus());
        }

        // Aplicar as alterações no Graph
        try {
            log.info("Enviando PATCH para o Microsoft Graph: microsoftId={}, displayName={}, jobTitle={}, department={}, state={}, accountEnabled={}",
                microsoftId,
                graphUpdate.getDisplayName(),
                graphUpdate.getJobTitle(),
                graphUpdate.getDepartment(),
                graphUpdate.getState(),
                graphUpdate.getAccountEnabled());

            graphClient.users().byUserId(microsoftId).patch(graphUpdate);
            log.info("Perfil do usuário {} atualizado com sucesso no Microsoft Graph", microsoftId);
        } catch (Exception exception) {
            log.error("Erro ao atualizar perfil no Microsoft Graph: {}", exception.getMessage(), exception);
            throw new IllegalStateException("Falha ao atualizar o perfil do colaborador no Microsoft Graph: " + exception.getMessage(), exception);
        }
    }

    private Set<nexora.planning.nexora.enums.MicrosoftLicense> licenses(Employee employee) {
        return employee.getMicrosoftLicenses() == null
            ? Set.of()
            : new HashSet<>(employee.getMicrosoftLicenses());
    }

    private boolean same(Object first, Object second) {
        return java.util.Objects.equals(first, second);
    }
}