package nexora.planning.nexora.service;

import com.microsoft.graph.models.User;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import nexora.planning.nexora.dto.MicrosoftSyncResult;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MicrosoftSyncService {

    private final GraphServiceClient graphClient;
    private final EmployeeRepository employeeRepository;
    private final EventStoreService eventStoreService;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int BATCH_SIZE = 50;

    public List<User> getAllUsers() {
        log.info("Buscando todos os usuários do Microsoft 365...");
        
        if (graphClient == null) {
            log.error("GraphServiceClient não está disponível!");
            throw new RuntimeException("GraphServiceClient não configurado");
        }
        
        List<User> allUsers = new ArrayList<>();
        
        try {
            var usersCollection = graphClient.users()
                .get(requestConfiguration -> {
                    requestConfiguration.queryParameters.select = new String[]{
                        "id",
                        "displayName",
                        "givenName",
                        "surname",
                        "mail",
                        "userPrincipalName",
                        "jobTitle",
                        "department",
                        "accountEnabled",
                        "state",
                        "assignedLicenses"
                    };
                });
            
            if (usersCollection != null && usersCollection.getValue() != null) {
                allUsers.addAll(usersCollection.getValue());
            }

            String nextLink = usersCollection != null ? usersCollection.getOdataNextLink() : null;
            while (nextLink != null && !nextLink.isEmpty()) {
                var nextPage = graphClient.users()
                    .withUrl(nextLink)
                    .get(requestConfiguration -> {
                        requestConfiguration.queryParameters.select = new String[]{
                            "id",
                            "displayName",
                            "givenName",
                            "surname",
                            "mail",
                            "userPrincipalName",
                            "jobTitle",
                            "department",
                            "accountEnabled",
                            "state",
                            "assignedLicenses"
                        };
                    });
                if (nextPage != null && nextPage.getValue() != null) {
                    allUsers.addAll(nextPage.getValue());
                }
                nextLink = nextPage != null ? nextPage.getOdataNextLink() : null;
            }

            log.info("{} usuários encontrados no Microsoft 365", allUsers.size());
            return allUsers;
            
        } catch (Exception e) {
            log.error("Erro ao buscar usuários: {}", e.getMessage());
            throw new RuntimeException("Falha ao buscar usuários do Microsoft 365", e);
        }
    }

    public MicrosoftSyncResult syncAllUsers() {
        log.info("INICIANDO SINCRONIZAÇÃO DE USUÁRIOS");
        
        MicrosoftSyncResult result = new MicrosoftSyncResult();
        result.setStartTime(LocalDateTime.now());
        
        try {
            List<User> microsoftUsers = getAllUsers();
            result.setTotalMicrosoftUsers(microsoftUsers.size());
            
            int imported = 0;
            int updated = 0;
            int errors = 0;

            for (int i = 0; i < microsoftUsers.size(); i += BATCH_SIZE) {
                int end = Math.min(i + BATCH_SIZE, microsoftUsers.size());
                List<User> batch = microsoftUsers.subList(i, end);
                
                log.info("Processando lote {}/{} (usuários {} a {})", 
                    (i / BATCH_SIZE) + 1, 
                    (int) Math.ceil(microsoftUsers.size() / (double) BATCH_SIZE),
                    i + 1, end);
                
                BatchResult batchResult = processBatch(batch);
                
                imported += batchResult.imported;
                updated += batchResult.updated;
                errors += batchResult.errors;
                
                entityManager.clear();
                
                log.info("Lote processado: {} importados, {} atualizados, {} erros", 
                    batchResult.imported, batchResult.updated, batchResult.errors);
            }
            
            result.setImported(imported);
            result.setUpdated(updated);
            result.setErrors(errors);
            result.setSuccess(errors == 0);
            result.setEndTime(LocalDateTime.now());
            
            log.info("SINCRONIZAÇÃO CONCLUÍDA!");
            log.info("Total: {} | Importados: {} | Atualizados: {} | Erros: {}", 
                result.getTotalMicrosoftUsers(), imported, updated, errors);
            
        } catch (Exception e) {
            log.error("Erro na sincronização: {}", e.getMessage());
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }
        
        return result;
    }

    @Transactional
    public BatchResult processBatch(List<User> batch) {
        BatchResult result = new BatchResult();
        Map<User, String> userEmails = new LinkedHashMap<>();
        Set<String> emails = new LinkedHashSet<>();

        for (User msUser : batch) {
            String email = msUser.getMail() != null ? msUser.getMail() : msUser.getUserPrincipalName();
            if (email == null || email.isBlank()) {
                log.warn("Usuário sem email: {}", msUser.getDisplayName());
                result.errors++;
                continue;
            }
            userEmails.put(msUser, email);
            emails.add(email);
        }

        Map<String, Employee> existingByEmail = new HashMap<>();
        if (!emails.isEmpty()) {
            employeeRepository.findAllByEmailIn(emails)
                .forEach(employee -> existingByEmail.put(employee.getEmail(), employee));
        }

        List<PendingSave> pendingSaves = new ArrayList<>();
        
        for (Map.Entry<User, String> userEntry : userEmails.entrySet()) {
            User msUser = userEntry.getKey();
            String email = userEntry.getValue();
            try {
                log.debug("Processando usuário: {} - State: {} - AssignedLicenses: {}", 
                    email, msUser.getState(), 
                    msUser.getAssignedLicenses() != null ? msUser.getAssignedLicenses().size() : 0);
                
                Employee existing = existingByEmail.get(email);
                if (existing != null) {
                    Employee employee = existing;
                    boolean changed = updateEmployee(employee, msUser);
                    if (changed) {
                        pendingSaves.add(new PendingSave(employee, false));
                    }
                } else {
                    Employee employee = createEmployee(msUser);
                    existingByEmail.put(email, employee);
                    pendingSaves.add(new PendingSave(employee, true));
                }
            } catch (Exception e) {
                log.error("Erro ao processar usuário {}: {}", 
                    email,
                    e.getMessage());
                result.errors++;
            }
        }

        try {
            employeeRepository.saveAll(pendingSaves.stream().map(PendingSave::employee).toList());
            result.imported += (int) pendingSaves.stream().filter(PendingSave::imported).count();
            result.updated += (int) pendingSaves.stream().filter(pending -> !pending.imported()).count();
        } catch (Exception batchError) {
            log.warn("Falha ao salvar lote; tentando persistir usuários individualmente: {}", batchError.getMessage());
            for (PendingSave pending : pendingSaves) {
                try {
                    employeeRepository.save(pending.employee());
                    if (pending.imported()) result.imported++;
                    else result.updated++;
                } catch (Exception e) {
                    log.error("Erro ao salvar usuário {}: {}", pending.employee().getEmail(), e.getMessage());
                    result.errors++;
                }
            }
        }
        
        return result;
    }

    private Employee createEmployee(User msUser) {
        Employee employee = new Employee();
        
        String firstName = msUser.getGivenName() != null ? msUser.getGivenName().trim() : "";
        String lastName = msUser.getSurname() != null ? msUser.getSurname().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        
        if (fullName.isEmpty()) {
            fullName = msUser.getDisplayName() != null ? msUser.getDisplayName() : "Usuário";
        }
        
        employee.setName(fullName);
        employee.setEmail(msUser.getMail() != null ? msUser.getMail() : msUser.getUserPrincipalName());
        employee.setPosition(msUser.getJobTitle() != null ? msUser.getJobTitle() : "Não definido");
        employee.setDepartment(msUser.getDepartment() != null ? msUser.getDepartment() : "Não definido");
        employee.setStatus(extractStatusFromDisplayName(msUser.getDisplayName()));

        String location = msUser.getState();
        if (location == null || location.isEmpty()) {
            location = msUser.getUsageLocation();
        }
        employee.setCostCenter(extractCostCenterFromLocation(location));

        Set<MicrosoftLicense> licenses = extractLicenses(msUser);
        employee.setMicrosoftLicenses(licenses);
        
        // Log para debug
        log.debug("Usuário {} - CostCenter: {} - Licenças: {}", 
            employee.getEmail(), 
            employee.getCostCenter(), 
            licenses.size());
        
        return employee;
    }

    private boolean updateEmployee(Employee employee, User msUser) {
        boolean changed = false;
        
        // Name
        String firstName = msUser.getGivenName() != null ? msUser.getGivenName().trim() : "";
        String lastName = msUser.getSurname() != null ? msUser.getSurname().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        
        if (fullName.isEmpty()) {
            fullName = msUser.getDisplayName() != null ? msUser.getDisplayName() : "Usuário";
        }
        
        if (!fullName.equals(employee.getName())) {
            employee.setName(fullName);
            changed = true;
        }
        
        if (msUser.getJobTitle() != null && !msUser.getJobTitle().equals(employee.getPosition())) {
            employee.setPosition(msUser.getJobTitle());
            changed = true;
        }
        
        String department = msUser.getDepartment() != null ? msUser.getDepartment() : "Não definido";
        if (!department.equals(employee.getDepartment())) {
            employee.setDepartment(department);
            changed = true;
        }
        
        EmployeeStatus newStatus = extractStatusFromDisplayName(msUser.getDisplayName());
        if (employee.getStatus() != newStatus) {
            employee.setStatus(newStatus);
            changed = true;
        }

        String location = msUser.getState();
        if (location == null || location.isEmpty()) {
            location = msUser.getUsageLocation();
        }
        costCenter newCostCenter = extractCostCenterFromLocation(location);
        if (employee.getCostCenter() != newCostCenter) {
            employee.setCostCenter(newCostCenter);
            changed = true;
        }
        
        Set<MicrosoftLicense> newLicenses = extractLicenses(msUser);
        if (!employee.getMicrosoftLicenses().equals(newLicenses)) {
            employee.setMicrosoftLicenses(newLicenses);
            changed = true;
        }
        
        return changed;
    }

    private EmployeeStatus extractStatusFromDisplayName(String displayName) {
        if (displayName == null) {
            return EmployeeStatus.ACTIVE;
        }
        
        if (displayName.contains("| Inativo") || 
            displayName.toLowerCase().contains("inativo") || 
            displayName.toLowerCase().contains("inactive")) {
            return EmployeeStatus.INACTIVE;
        }
        
        return EmployeeStatus.ACTIVE;
    }

    /**
     * Extrai o costCenter de uma localização (state ou usageLocation)
     */
    private costCenter extractCostCenterFromLocation(String location) {
        if (location == null || location.isEmpty()) {
            log.debug("Location vazio, usando PAC como padrão");
            return costCenter.PAC;
        }
        
        // Mapear localizações para centros de custo
        Map<String, costCenter> locationMap = new HashMap<>();
        locationMap.put("MAROX", costCenter.MAROX);
        locationMap.put("PAC", costCenter.PAC);
        locationMap.put("PAC SUDESTE", costCenter.PAC_SUDESTE);
        locationMap.put("BELEM", costCenter.BELEM);
        locationMap.put("SAO LUIS", costCenter.SAO_LUIS);
        locationMap.put("PATOS DE MINAS", costCenter.PATOS_DE_MINAS);
        locationMap.put("CAMPO NOVO", costCenter.CAMPO_NOVO);
        locationMap.put("MACEIO", costCenter.MACEIO);
        locationMap.put("FORTALEZA", costCenter.FORTALEZA);
        
        // Tentar encontrar correspondência
        String locationUpper = location.toUpperCase().trim();
        for (Map.Entry<String, costCenter> entry : locationMap.entrySet()) {
            if (locationUpper.contains(entry.getKey()) || entry.getKey().contains(locationUpper)) {
                log.debug("Location '{}' mapeado para {}", location, entry.getValue());
                return entry.getValue();
            }
        }
        
        // Tentar por enum diretamente
        try {
            costCenter result = costCenter.valueOf(locationUpper);
            log.debug("Location '{}' mapeado diretamente para {}", location, result);
            return result;
        } catch (IllegalArgumentException e) {
            log.debug("Location '{}' não mapeado, usando PAC como padrão", location);
            return costCenter.PAC;
        }
    }

    /**
     * Extrai e mapeia as licenças do usuário do Microsoft Graph
     */
    private Set<MicrosoftLicense> extractLicenses(User msUser) {
        Set<MicrosoftLicense> licenses = new HashSet<>();
        
        if (msUser.getAssignedLicenses() == null || msUser.getAssignedLicenses().isEmpty()) {
            log.debug("Usuário {} não possui licenças atribuídas", msUser.getMail());
            return licenses;
        }
        
        log.debug("Usuário {} possui {} licença(s)", msUser.getMail(), msUser.getAssignedLicenses().size());
        
        for (var assignedLicense : msUser.getAssignedLicenses()) {
            if (assignedLicense.getSkuId() != null) {
                String skuId = assignedLicense.getSkuId().toString();
                log.debug("SKU ID encontrado: {}", skuId);
                
                // Mapear SKU ID para o nome da licença
                String licenseName = mapSkuIdToLicenseName(skuId);
                if (licenseName != null) {
                    try {
                        MicrosoftLicense license = MicrosoftLicense.fromDisplayName(licenseName);
                        if (license != MicrosoftLicense.NONE) {
                            licenses.add(license);
                            log.debug("Licença mapeada: {} -> {}", skuId, licenseName);
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao mapear licença {}: {}", skuId, e.getMessage());
                    }
                } else {
                    log.warn("SKU ID não mapeado: {}", skuId);
                }
            }
        }
        
        log.debug("Total de licenças mapeadas para {}: {}", msUser.getMail(), licenses.size());
        return licenses;
    }

    /**
     * Mapeia SKU ID para o nome da licença
     */
    private String mapSkuIdToLicenseName(String skuId) {
        Map<String, String> skuMap = new HashMap<>();
        
        // Office 365
        skuMap.put("6fd2c87f-b296-42f0-b197-1e91e994b900", "Office 365 E3");
        skuMap.put("c7df2760-2c81-4ef7-b578-5b5392b571df", "Office 365 E1");
        skuMap.put("3b555118-da6a-4418-894f-7df1e2096870", "Office 365 F3");
        skuMap.put("95f3ad29-f1b8-48c8-a8f0-05b9f1edb898", "Office 365 E5");
        
        // Microsoft 365
        skuMap.put("e82ae690-a2d5-4d76-8d30-7c6e01e6022e", "Microsoft 365 E5");
        skuMap.put("05e9a617-0261-4cee-bb44-138d3ef5d965", "Microsoft 365 E3");
        
        // Microsoft 365 Business
        skuMap.put("18181a46-0d4e-45cd-891e-60aabd171b4e", "Microsoft 365 Business Basic");
        skuMap.put("c42b9cae-ea4f-4ab7-9717-81576235ccac", "Microsoft 365 Business Basic");
        skuMap.put("fc2b5d65-c4cd-4baf-8c7c-7f4f4f4f4f4f", "Microsoft 365 Business Standard");
        skuMap.put("3b555118-da6a-4418-894f-7df1e2096870", "Microsoft 365 Business Premium");
        
        // Power BI
        skuMap.put("f8a1db68-be16-40ed-86d5-cb42ce701560", "Power BI Pro");
        skuMap.put("a403ebcc-fae0-4ca2-8c8c-7a907fd6c235", "Power BI Premium Per User");
        
        // Exchange Online
        skuMap.put("9b5f7f5d-5f9a-4f8a-9f7f-5f9a4f8a9f7f", "Exchange Online Plan 1");
        skuMap.put("4a9f9f5d-5f9a-4f8a-9f7f-5f9a4f8a9f7f", "Exchange Online Plan 2");
        skuMap.put("f9d8f4f5-5f9a-4f8a-9f7f-5f9a4f8a9f7f", "Exchange Online Kiosk");
        
        // Teams
        skuMap.put("57ff2da0-773e-42df-b2af-ffb7a2317929", "Microsoft Teams");
        
        // Project
        skuMap.put("f9f5f5d5-5f9a-4f8a-9f7f-5f9a4f8a9f7f", "Project Online Plan 1");
        skuMap.put("f9f5f5d5-5f9a-4f8a-9f7f-5f9a4f8a9f8f", "Project Online Plan 3");
        
        // Visio
        skuMap.put("f9f5f5d5-5f9a-4f8a-9f7f-5f9a4f8a9f9f", "Visio Online Plan 1");
        skuMap.put("f9f5f5d5-5f9a-4f8a-9f7f-5f9a4f8a9f0f", "Visio Online Plan 2");
        
        return skuMap.getOrDefault(skuId, null);
    }

    private static class BatchResult {
        int imported = 0;
        int updated = 0;
        int errors = 0;
    }

    private record PendingSave(Employee employee, boolean imported) {}
}