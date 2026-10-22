package nexora.planning.nexora.service;

import com.microsoft.graph.models.PasswordProfile;
import com.microsoft.graph.models.User;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nexora.planning.nexora.dto.EmployeeRequestDTO;
import nexora.planning.nexora.util.MicrosoftDepartmentFormatter;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MicrosoftUserProvisioningService {

    private final GraphServiceClient graphClient;
    private final MicrosoftLicenseService microsoftLicenseService;

    public String createUser(EmployeeRequestDTO request) {
        if (graphClient == null) {
            throw new IllegalStateException("Microsoft Graph não está configurado para criar usuários.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("A senha inicial é obrigatória para criar a conta Microsoft.");
        }

        User user = new User();
        user.setAccountEnabled(request.getStatus() == null || request.getStatus().name().equals("ACTIVE"));
        user.setDisplayName(valueOrDefault(request.getDisplayName(), request.getName()));
        user.setGivenName(valueOrDefault(request.getFirstName(), request.getName()));
        user.setSurname(valueOrDefault(request.getLastName(), ""));
        user.setUserPrincipalName(request.getEmail().trim());
        user.setMailNickname(mailNickname(request.getEmail()));
        user.setJobTitle(request.getPosition());
        user.setDepartment(valueOrDefault(
            request.getMicrosoftDepartment(),
            MicrosoftDepartmentFormatter.format(request.getDepartment(), request.getLeader())
        ));
        user.setOfficeLocation(request.getOffice());
        user.setState(request.getState());
        user.setUsageLocation("BR");

        PasswordProfile passwordProfile = new PasswordProfile();
        passwordProfile.setPassword(request.getPassword());
        passwordProfile.setForceChangePasswordNextSignIn(true);
        user.setPasswordProfile(passwordProfile);

        User createdUser;
        try {
            createdUser = graphClient.users().post(user);
        } catch (RuntimeException e) {
            String graphMessage = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
            if (graphMessage.contains("password")
                && (graphMessage.contains("complexity") || graphMessage.contains("does not comply"))) {
                throw new IllegalArgumentException(
                    "A senha foi recusada pela política de segurança do Microsoft 365. Tente outra senha permitida pela organização.",
                    e
                );
            }
            throw e;
        }
        String createdUserId = createdUser == null ? null : createdUser.getId();
        if (createdUserId == null || createdUserId.isBlank()) {
            throw new IllegalStateException("O Microsoft Graph não retornou o ID do usuário criado.");
        }

        try {
            microsoftLicenseService.assignInitialLicenses(createdUserId, request.getMicrosoftLicenses());
            return createdUserId;
        } catch (RuntimeException e) {
            deleteUser(createdUserId);
            throw new IllegalStateException("A conta Microsoft foi criada, mas não foi possível atribuir as licenças selecionadas.", e);
        }
    }

    public void deleteUser(String userId) {
        try {
            graphClient.users().byUserId(userId).delete();
        } catch (Exception e) {
            log.error("Não foi possível remover do Microsoft Graph o usuário {} após falha local: {}", userId, e.getMessage());
        }
    }

    private String mailNickname(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String nickname = localPart.replaceAll("[^A-Za-z0-9._-]", "");
        return nickname.isBlank() ? "employee" : nickname;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}