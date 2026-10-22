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
    private final MicrosoftLicenseService microsoftLicenseService;

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
            Map<String, MicrosoftLicense> managedLicensesBySku = microsoftLicenseService.getManagedSkuIdMap();
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
                
                BatchResult batchResult = processBatch(batch, managedLicensesBySku);
                
                imported += batchResult.imported;
                updated += batchResult.updated;
                errors += batchResult.errors;
                result.getErrorDetails().putAll(batchResult.errorDetails);
                
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
    public BatchResult processBatch(List<User> batch, Map<String, MicrosoftLicense> managedLicensesBySku) {
        BatchResult result = new BatchResult();
        Map<User, String> userEmails = new LinkedHashMap<>();
        Set<String> emails = new LinkedHashSet<>();

        for (User msUser : batch) {
            String email = resolveEmail(msUser);
            if (email == null) {
                log.warn("Usuário sem email: {}", msUser.getDisplayName());
                result.errors++;
                result.errorDetails.put(
                    msUser.getId() != null ? msUser.getId() : String.valueOf(msUser.getDisplayName()),
                    "Usuário sem mail e sem userPrincipalName."
                );
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
                    boolean changed = updateEmployee(employee, msUser, managedLicensesBySku);
                    if (changed) {
                        pendingSaves.add(new PendingSave(employee, false));
                    }
                } else {
                    Employee employee = createEmployee(msUser, managedLicensesBySku);
                    existingByEmail.put(email, employee);
                    pendingSaves.add(new PendingSave(employee, true));
                }
            } catch (Exception e) {
                log.error("Erro ao processar usuário {}: {}", 
                    email,
                    e.getMessage());
                result.errors++;
                result.errorDetails.put(email, e.getMessage());
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
                    result.errorDetails.put(pending.employee().getEmail(), e.getMessage());
                }
            }
        }
        
        return result;
    }

    private Employee createEmployee(User msUser, Map<String, MicrosoftLicense> managedLicensesBySku) {
        Employee employee = new Employee();
        
        String firstName = msUser.getGivenName() != null ? msUser.getGivenName().trim() : "";
        String lastName = msUser.getSurname() != null ? msUser.getSurname().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        
        if (fullName.isEmpty()) {
            fullName = msUser.getDisplayName() != null ? msUser.getDisplayName() : "Usuário";
        }
        
        employee.setName(fullName);
        employee.setEmail(resolveEmail(msUser));
        employee.setMicrosoftId(msUser.getId());
        employee.setPosition(msUser.getJobTitle() != null ? msUser.getJobTitle() : "Não definido");
        employee.setDepartment(msUser.getDepartment() != null ? msUser.getDepartment() : "Não definido");
        employee.setStatus(extractStatusFromDisplayName(msUser.getDisplayName()));

        String location = msUser.getState();
        if (location == null || location.isEmpty()) {
            location = msUser.getUsageLocation();
        }
        employee.setCostCenter(extractCostCenterFromLocation(location));

        Set<MicrosoftLicense> licenses = extractLicenses(msUser, managedLicensesBySku);
        employee.setMicrosoftLicenses(licenses);
        
        // Log para debug
        log.debug("Usuário {} - CostCenter: {} - Licenças: {}", 
            employee.getEmail(), 
            employee.getCostCenter(), 
            licenses.size());
        
        return employee;
    }

    private boolean updateEmployee(Employee employee, User msUser, Map<String, MicrosoftLicense> managedLicensesBySku) {
        boolean changed = false;

        if (msUser.getId() != null && !msUser.getId().equals(employee.getMicrosoftId())) {
            employee.setMicrosoftId(msUser.getId());
            changed = true;
        }
        
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
        
        Set<MicrosoftLicense> newLicenses = extractLicenses(msUser, managedLicensesBySku);
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

    private String resolveEmail(User msUser) {
        String mail = msUser.getMail();
        if (mail != null && !mail.isBlank()) {
            return mail.trim();
        }

        String userPrincipalName = msUser.getUserPrincipalName();
        if (userPrincipalName != null && !userPrincipalName.isBlank()) {
            return userPrincipalName.trim();
        }

        return null;
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
        locationMap.put("PATOS DE MINAS", costCenter.PATOS_DE_MINAS);
        
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
    private Set<MicrosoftLicense> extractLicenses(User msUser, Map<String, MicrosoftLicense> managedLicensesBySku) {
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
                
                MicrosoftLicense license = managedLicensesBySku.get(skuId.toLowerCase(Locale.ROOT));
                if (license != null && license.isManaged()) {
                    licenses.add(license);
                    log.debug("Licença gerenciada mapeada: {} -> {}", skuId, license.getDisplayName());
                } else {
                    log.debug("SKU não pertencente ao catálogo gerenciado, ignorado: {}", skuId);
                }
            }
        }
        
        log.debug("Total de licenças mapeadas para {}: {}", msUser.getMail(), licenses.size());
        return licenses;
    }

    private static class BatchResult {
        int imported = 0;
        int updated = 0;
        int errors = 0;
        Map<String, String> errorDetails = new LinkedHashMap<>();
    }

    private record PendingSave(Employee employee, boolean imported) {}
}