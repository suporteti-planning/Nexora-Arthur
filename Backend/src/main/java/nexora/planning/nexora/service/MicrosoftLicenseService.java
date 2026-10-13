package nexora.planning.nexora.service;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientSecretCredential;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import nexora.planning.nexora.dto.MicrosoftLicenseInventoryDTO;
import nexora.planning.nexora.dto.MicrosoftLicenseInventoryDTO.Assignment;
import nexora.planning.nexora.dto.MicrosoftLicenseInventoryDTO.LicensedUser;
import nexora.planning.nexora.dto.MicrosoftLicenseInventoryDTO.LicenseSku;
import nexora.planning.nexora.enums.MicrosoftLicense;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MicrosoftLicenseService {
    private static final String GRAPH_SCOPE = "https://graph.microsoft.com/.default";
    private static final String SKU_PATH = "/subscribedSkus?$select=skuId,skuPartNumber,capabilityStatus,consumedUnits,prepaidUnits";
    private static final String USERS_PATH = "/users?$select=id,displayName,mail,userPrincipalName,accountEnabled,assignedLicenses,licenseAssignmentStates&$top=999";

    private final ObjectProvider<ClientSecretCredential> credentialProvider;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String graphApiUrl;

    public MicrosoftLicenseService(
        ObjectProvider<ClientSecretCredential> credentialProvider,
        ObjectMapper objectMapper,
        @Value("${microsoft.graph.api-url:https://graph.microsoft.com/v1.0}") String graphApiUrl
    ) {
        this.credentialProvider = credentialProvider;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
        this.graphApiUrl = graphApiUrl.replaceAll("/$", "");
    }

    public MicrosoftLicenseInventoryDTO getInventory() {
        String token = getAccessToken();
        JsonNode skuResponse = getJson(token, graphApiUrl + SKU_PATH);
        JsonNode usersResponse = getJson(token, graphApiUrl + USERS_PATH);

        List<LicenseSku> licenses = new ArrayList<>();
        Set<String> managedSkuIds = new LinkedHashSet<>();
        for (JsonNode sku : readAllPages(token, skuResponse)) {
            String skuId = sku.path("skuId").asText("");
            if (skuId.isBlank()) continue;
            String skuPartNumber = sku.path("skuPartNumber").asText(skuId);
            MicrosoftLicense managedLicense = MicrosoftLicense.fromSkuPartNumber(skuPartNumber);
            if (managedLicense == null || !managedLicense.isManaged()) continue;
            String status = sku.path("capabilityStatus").asText("Unknown");
            int purchased = sku.path("prepaidUnits").path("enabled").asInt(0);
            int consumed = sku.path("consumedUnits").asInt(0);
            licenses.add(new LicenseSku(
                skuId,
                skuPartNumber,
                managedLicense.name(),
                managedLicense.getDisplayName(),
                status,
                purchased,
                consumed,
                Math.max(0, purchased - consumed)
            ));
            managedSkuIds.add(normalizeSku(skuId));
        }

        List<LicensedUser> users = new ArrayList<>();
        for (JsonNode user : readAllPages(token, usersResponse)) {
            String userId = user.path("id").asText("");
            if (userId.isBlank()) continue;

            Set<String> assignedSkus = new LinkedHashSet<>();
            JsonNode assignedLicenses = user.path("assignedLicenses");
            if (assignedLicenses.isArray()) {
                for (JsonNode assigned : assignedLicenses) {
                    String skuId = assigned.path("skuId").asText("");
                    if (!skuId.isBlank() && managedSkuIds.contains(normalizeSku(skuId))) assignedSkus.add(skuId);
                }
            }

            Map<String, AssignmentBuilder> assignmentBuilders = new LinkedHashMap<>();
            JsonNode assignmentStates = user.path("licenseAssignmentStates");
            if (assignmentStates.isArray()) {
                for (JsonNode state : assignmentStates) {
                    String skuId = state.path("skuId").asText("");
                    if (skuId.isBlank() || !managedSkuIds.contains(normalizeSku(skuId))) continue;
                    String normalizedSku = normalizeSku(skuId);
                    AssignmentBuilder builder = assignmentBuilders.computeIfAbsent(normalizedSku, ignored -> new AssignmentBuilder());
                    String groupId = state.path("assignedByGroup").asText("");
                    if (groupId.isBlank() || "null".equalsIgnoreCase(groupId)) builder.directlyAssigned = true;
                    else builder.groupIds.add(groupId);
                    String assignmentState = state.path("state").asText("");
                    if (!assignmentState.isBlank()) builder.states.add(assignmentState);
                    String error = state.path("error").asText("");
                    if (!error.isBlank() && !"None".equalsIgnoreCase(error)) builder.errors.add(error);
                }
            }

            Map<String, Assignment> assignments = new LinkedHashMap<>();
            assignmentBuilders.forEach((skuId, builder) -> assignments.put(
                skuId,
                new Assignment(builder.directlyAssigned, List.copyOf(builder.groupIds), List.copyOf(builder.states), List.copyOf(builder.errors))
            ));
            String email = user.path("mail").asText("");
            if (email.isBlank()) email = user.path("userPrincipalName").asText("");
            users.add(new LicensedUser(
                userId,
                user.path("displayName").asText(email),
                email,
                user.path("accountEnabled").asBoolean(false),
                List.copyOf(assignedSkus),
                assignments
            ));
        }

        return new MicrosoftLicenseInventoryDTO(LocalDateTime.now(), List.copyOf(licenses), List.copyOf(users));
    }

    public void assign(String userId, String skuId) {
        UUID.fromString(userId);
        UUID.fromString(skuId);
        MicrosoftLicenseInventoryDTO inventory = getInventory();
        LicenseSku license = requireManagedTenantSku(inventory, skuId);
        if (!"Enabled".equalsIgnoreCase(license.capabilityStatus())) {
            throw new IllegalStateException("Esta licença não está habilitada para atribuição no tenant.");
        }
        if (license.available() < 1) {
            throw new IllegalStateException("Não há unidades disponíveis para este SKU no tenant.");
        }
        LicensedUser user = inventory.users().stream()
            .filter(candidate -> candidate.id().equalsIgnoreCase(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant Microsoft."));
        if (!user.active()) throw new IllegalStateException("Não é possível atribuir licença a um usuário desativado.");
        if (user.assignedSkuIds().stream().anyMatch(existing -> normalizeSku(existing).equals(normalizeSku(skuId)))) {
            throw new IllegalStateException("O usuário já possui este SKU atribuído.");
        }

        postLicenseChange(userId, Map.of(
            "addLicenses", List.of(Map.of("skuId", skuId, "disabledPlans", List.of())),
            "removeLicenses", List.of()
        ));
    }

    public void assignInitialLicenses(String userId, Set<MicrosoftLicense> requestedLicenses) {
        if (requestedLicenses == null || requestedLicenses.isEmpty()) return;
        if (requestedLicenses.stream().anyMatch(license -> license == null || !license.isManaged())) {
            throw new IllegalArgumentException("A criação permite somente licenças gerenciadas pelo projeto.");
        }

        MicrosoftLicenseInventoryDTO inventory = getInventory();
        List<Map<String, Object>> addLicenses = new ArrayList<>();
        for (MicrosoftLicense requestedLicense : requestedLicenses) {
            LicenseSku tenantSku = inventory.licenses().stream()
                .filter(license -> MicrosoftLicense.fromSkuPartNumber(license.skuPartNumber()) == requestedLicense)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "A licença " + requestedLicense.getDisplayName() + " não está disponível neste tenant."
                ));

            if (!"Enabled".equalsIgnoreCase(tenantSku.capabilityStatus())) {
                throw new IllegalStateException("A licença " + requestedLicense.getDisplayName() + " não está habilitada no tenant.");
            }
            if (tenantSku.available() < 1) {
                throw new IllegalStateException("Não há unidades disponíveis de " + requestedLicense.getDisplayName() + ".");
            }

            addLicenses.add(Map.of("skuId", tenantSku.skuId(), "disabledPlans", List.of()));
        }

        postLicenseChange(userId, Map.of("addLicenses", addLicenses, "removeLicenses", List.of()));
    }

    public void syncUserLicenses(String userId, Set<MicrosoftLicense> requestedLicenses) {
        if (requestedLicenses == null) requestedLicenses = Set.of();
        if (requestedLicenses.stream().anyMatch(license -> license == null || !license.isManaged())) {
            throw new IllegalArgumentException("A sincronização permite somente licenças Microsoft gerenciadas pelo projeto.");
        }

        MicrosoftLicenseInventoryDTO inventory = getInventory();
        LicensedUser user = inventory.users().stream()
            .filter(candidate -> candidate.id().equalsIgnoreCase(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant Microsoft."));

        Map<String, LicenseSku> managedSkus = new HashMap<>();
        Map<String, MicrosoftLicense> managedLicenseBySku = new HashMap<>();
        for (LicenseSku sku : inventory.licenses()) {
            String key = normalizeSku(sku.skuId());
            managedSkus.put(key, sku);
            managedLicenseBySku.put(key, MicrosoftLicense.fromSkuPartNumber(sku.skuPartNumber()));
        }

        Map<String, MicrosoftLicense> currentBySku = new LinkedHashMap<>();
        for (String assignedSkuId : user.assignedSkuIds()) {
            String key = normalizeSku(assignedSkuId);
            MicrosoftLicense license = managedLicenseBySku.get(key);
            if (license != null) currentBySku.put(key, license);
        }
        Set<MicrosoftLicense> currentLicenses = new LinkedHashSet<>(currentBySku.values());

        List<String> removeLicenses = new ArrayList<>();
        for (Map.Entry<String, MicrosoftLicense> assignment : currentBySku.entrySet()) {
            if (requestedLicenses.contains(assignment.getValue())) continue;
            Assignment details = user.assignments().get(assignment.getKey());
            if (details != null && !details.assignedByGroups().isEmpty()) {
                throw new IllegalStateException(
                    "A licença " + assignment.getValue().getDisplayName()
                        + " é atribuída por grupo. Remova-a do grupo no Microsoft Entra ID."
                );
            }
            removeLicenses.add(managedSkus.get(assignment.getKey()).skuId());
        }

        List<Map<String, Object>> addLicenses = new ArrayList<>();
        for (MicrosoftLicense requested : requestedLicenses) {
            if (currentLicenses.contains(requested)) continue;
            LicenseSku sku = inventory.licenses().stream()
                .filter(candidate -> MicrosoftLicense.fromSkuPartNumber(candidate.skuPartNumber()) == requested)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "A licença " + requested.getDisplayName() + " não está disponível neste tenant."
                ));
            if (!"Enabled".equalsIgnoreCase(sku.capabilityStatus())) {
                throw new IllegalStateException("A licença " + requested.getDisplayName() + " não está habilitada no tenant.");
            }
            if (sku.available() < 1) {
                throw new IllegalStateException("Não há unidades disponíveis de " + requested.getDisplayName() + ".");
            }
            addLicenses.add(Map.of("skuId", sku.skuId(), "disabledPlans", List.of()));
        }

        if (!addLicenses.isEmpty() || !removeLicenses.isEmpty()) {
            postLicenseChange(userId, Map.of("addLicenses", addLicenses, "removeLicenses", removeLicenses));
        }
    }

    public void revoke(String userId, String skuId) {
        UUID.fromString(userId);
        UUID.fromString(skuId);
        MicrosoftLicenseInventoryDTO inventory = getInventory();
        requireManagedTenantSku(inventory, skuId);
        LicensedUser user = inventory.users().stream()
            .filter(candidate -> candidate.id().equalsIgnoreCase(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant Microsoft."));
        String normalizedSku = normalizeSku(skuId);
        if (user.assignedSkuIds().stream().noneMatch(existing -> normalizeSku(existing).equals(normalizedSku))) {
            throw new IllegalStateException("O usuário não possui este SKU atribuído.");
        }
        Assignment assignment = user.assignments().get(normalizedSku);
        if (assignment != null && !assignment.assignedByGroups().isEmpty()) {
            throw new IllegalStateException("Este SKU é atribuído por grupo. Remova a licença do grupo no Microsoft Entra ID.");
        }
        postLicenseChange(userId, Map.of(
            "addLicenses", List.of(),
            "removeLicenses", List.of(skuId)
        ));
    }

    public Map<String, MicrosoftLicense> getManagedSkuIdMap() {
        String token = getAccessToken();
        JsonNode skuResponse = getJson(token, graphApiUrl + SKU_PATH);
        Map<String, MicrosoftLicense> managedSkus = new HashMap<>();
        for (JsonNode sku : readAllPages(token, skuResponse)) {
            String skuId = sku.path("skuId").asText("");
            MicrosoftLicense license = MicrosoftLicense.fromSkuPartNumber(sku.path("skuPartNumber").asText(""));
            if (!skuId.isBlank() && license != null && license.isManaged()) {
                managedSkus.put(normalizeSku(skuId), license);
            }
        }
        return managedSkus;
    }

    private LicenseSku requireManagedTenantSku(MicrosoftLicenseInventoryDTO inventory, String skuId) {
        return inventory.licenses().stream()
            .filter(candidate -> normalizeSku(candidate.skuId()).equals(normalizeSku(skuId)))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Este SKU não pertence às licenças gerenciadas permitidas neste projeto."));
    }

    private void postLicenseChange(String userId, Map<String, Object> body) {
        String token = getAccessToken();
        restClient.post()
            .uri(URI.create(graphApiUrl + "/users/" + userId + "/assignLicense"))
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer " + token)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }

    private JsonNode getJson(String token, String url) {
        JsonNode body = restClient.get()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + token)
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .body(JsonNode.class);
        if (body == null) throw new IllegalStateException("O Microsoft Graph retornou uma resposta vazia.");
        return body;
    }

    private List<JsonNode> readAllPages(String token, JsonNode firstPage) {
        List<JsonNode> results = new ArrayList<>();
        JsonNode page = firstPage;
        while (page != null) {
            JsonNode values = page.path("value");
            if (values.isArray()) values.forEach(results::add);
            String nextLink = page.path("@odata.nextLink").asText("");
            page = nextLink.isBlank() ? null : getJson(token, nextLink);
        }
        return results;
    }

    private String getAccessToken() {
        ClientSecretCredential credential = credentialProvider.getIfAvailable();
        if (credential == null) {
            throw new IllegalStateException("Microsoft Graph não configurado. Defina AZURE_TENANT_ID, AZURE_CLIENT_ID e AZURE_CLIENT_SECRET.");
        }
        AccessToken token = credential.getToken(new TokenRequestContext().addScopes(GRAPH_SCOPE)).block();
        if (token == null || token.getToken() == null || token.getToken().isBlank()) {
            throw new IllegalStateException("Não foi possível obter um token de acesso para o Microsoft Graph.");
        }
        return token.getToken();
    }

    private String normalizeSku(String skuId) {
        return skuId.toLowerCase(Locale.ROOT);
    }

    private static final class AssignmentBuilder {
        private boolean directlyAssigned;
        private final Set<String> groupIds = new LinkedHashSet<>();
        private final Set<String> states = new LinkedHashSet<>();
        private final Set<String> errors = new LinkedHashSet<>();
    }
}
