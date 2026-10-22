package nexora.planning.nexora.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import nexora.planning.nexora.dto.EventStoreDTO;
import nexora.planning.nexora.enums.EventTypes;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.model.EventStore;
import nexora.planning.nexora.model.Notebook;
import nexora.planning.nexora.repository.EventStoreRepository;
import nexora.planning.nexora.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventStoreService {

    private final EventStoreRepository eventStoreRepository;
    private final NotebookRepository notebookRepository;
    private final ObjectMapper objectMapper;

    // ==================== SALVAR EVENTOS ====================

    @Transactional
    public void saveEvent(String aggregateType, Long aggregateId, 
                          EventTypes eventType, Map<String, Object> eventData,
                          Map<String, Object> metadata) {
        
        EventStore event = EventStore.builder()
            .eventId(UUID.randomUUID())
            .aggregateType(aggregateType)
            .aggregateId(aggregateId)
            .eventType(eventType.name())
            .eventData(eventData)
            .metadata(metadata != null ? metadata : new HashMap<>())
            .createdAt(LocalDateTime.now())
            .build();
        
        eventStoreRepository.save(event);
        log.info("Evento {} salvo para {} ID {}: {}", eventType, aggregateType, aggregateId, eventData);
    }

    // Métodos para cada tipo de evento

    public void logNotebookCreated(Notebook notebook, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("brand", notebook.getBrand());
        data.put("model", notebook.getModel());
        data.put("ram", notebook.getRam());
        data.put("storage", notebook.getStorage());
        data.put("costCenter", notebook.getCostCenter().name());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_CREATED, data, getMetadata(createdBy));
    }

    public void logNotebookAssigned(Notebook notebook, Employee employee, 
                                     String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("notebookSerial", notebook.getSerialNumber());
        data.put("notebookBrand", notebook.getBrand());
        data.put("notebookModel", notebook.getModel());
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("employeeCostCenter", employee.getCostCenter().getDisplayName());
        data.put("reason", reason);
        data.put("assignedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_ASSIGNED, data, getMetadata(createdBy));
    }

    public void logNotebookUnassigned(Notebook notebook, Employee employee, 
                                       String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("notebookSerial", notebook.getSerialNumber());
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("reason", reason);
        data.put("unassignedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_UNASSIGNED, data, getMetadata(createdBy));
    }

    public void logNotebookInactivated(Notebook notebook, String reason, 
                                        String details, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("brand", notebook.getBrand());
        data.put("model", notebook.getModel());
        data.put("reason", reason);
        data.put("details", details);
        data.put("previousStatus", notebook.getStatus());
        data.put("newStatus", "INACTIVE");
        data.put("inactivatedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_INACTIVATED, data, getMetadata(createdBy));
    }

    public void logNotebookReactivated(Notebook notebook, String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("brand", notebook.getBrand());
        data.put("model", notebook.getModel());
        data.put("reason", reason);
        data.put("previousStatus", notebook.getStatus());
        data.put("newStatus", "ACTIVE");
        data.put("reactivatedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_REACTIVATED, data, getMetadata(createdBy));
    }

    public void logNotebookStatusChanged(Notebook notebook, String previousStatus,
                                         String newStatus, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("previousStatus", previousStatus);
        data.put("newStatus", newStatus);
        data.put("changedAt", LocalDateTime.now());

        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_STATUS_CHANGED, data, getMetadata(createdBy));
    }

    public void logNotebookMaintenanceAdded(Notebook notebook, 
                                             String type,
                                             String description,
                                             String defect,
                                             String solution,
                                             String performedBy,
                                             Double cost,
                                             String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("brand", notebook.getBrand());
        data.put("model", notebook.getModel());
        data.put("type", type);               // REPARO, UPGRADE, LIMPEZA, PREVENTIVA
        data.put("description", description);
        data.put("defect", defect);           // Campo específico: defeito reportado
        data.put("solution", solution);       // Campo específico: solução aplicada
        data.put("performedBy", performedBy);
        data.put("cost", cost);
        data.put("maintenanceDate", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_MAINTENANCE_ADDED, data, getMetadata(createdBy));
    }

    public void logNotebookMaintenanceCompleted(Notebook notebook, 
                                                 String solution,
                                                 String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("solution", solution);
        data.put("completedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_MAINTENANCE_COMPLETED, data, getMetadata(createdBy));
    }

    public void logNotebookSpecUpdated(Notebook notebook, 
                                        String field,
                                        String oldValue,
                                        String newValue,
                                        String reason,
                                        String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("field", field);              // RAM, STORAGE, PROCESSOR
        data.put("oldValue", oldValue);
        data.put("newValue", newValue);
        data.put("reason", reason);
        data.put("updatedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_SPEC_UPDATED, data, getMetadata(createdBy));
    }

    public void logNotebookPriceUpdated(Notebook notebook, Double oldPrice, Double newPrice, String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("notebookId", notebook.getId());
        data.put("notebookName", notebook.getName());
        data.put("serialNumber", notebook.getSerialNumber());
        data.put("oldPrice", oldPrice);
        data.put("newPrice", newPrice);
        data.put("reason", reason);
        data.put("updatedAt", LocalDateTime.now());
        
        saveEvent("NOTEBOOK", notebook.getId(), EventTypes.NOTEBOOK_SPEC_UPDATED, data, getMetadata(createdBy));
    }

    public void logEmployeeCreated(Employee employee, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("position", employee.getPosition());
        data.put("department", employee.getDepartment());
        data.put("costCenter", employee.getCostCenter().getDisplayName());
        data.put("createdAt", LocalDateTime.now());
    
        saveEvent("EMPLOYEE", employee.getId(), EventTypes.EMPLOYEE_CREATED, data, getMetadata(createdBy));
    }

    public void logLicenseAdded(Employee employee, String license, 
                                 String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("license", license);
        data.put("reason", reason);
        data.put("action", "ADDED");
        data.put("addedAt", LocalDateTime.now());
        
        saveEvent("EMPLOYEE", employee.getId(), EventTypes.LICENSE_ADDED, data, getMetadata(createdBy));
    }

    public void logLicenseRemoved(Employee employee, String license, 
                                   String reason, String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("license", license);
        data.put("reason", reason);
        data.put("action", "REMOVED");
        data.put("removedAt", LocalDateTime.now());
        
        saveEvent("EMPLOYEE", employee.getId(), EventTypes.LICENSE_REMOVED, data, getMetadata(createdBy));
    }

    public void logEmployeeCostCenterChanged(Employee employee, String oldCenter, 
                                              String newCenter, String reason, 
                                              String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("oldCostCenter", oldCenter);
        data.put("newCostCenter", newCenter);
        data.put("reason", reason);
        data.put("changedAt", LocalDateTime.now());
        
        saveEvent("EMPLOYEE", employee.getId(), EventTypes.EMPLOYEE_COST_CENTER_CHANGED, data, getMetadata(createdBy));
    }

    public void logEmployeeStatusChanged(Employee employee, String oldStatus, 
                                          String newStatus, String reason, 
                                          String createdBy) {
        Map<String, Object> data = new HashMap<>();
        data.put("employeeId", employee.getId());
        data.put("employeeName", employee.getName());
        data.put("employeeEmail", employee.getEmail());
        data.put("oldStatus", oldStatus);
        data.put("newStatus", newStatus);
        data.put("reason", reason);
        data.put("changedAt", LocalDateTime.now());
        
        saveEvent("EMPLOYEE", employee.getId(), EventTypes.EMPLOYEE_STATUS_CHANGED, data, getMetadata(createdBy));
    }

    // Métodos de consulta

    public List<EventStoreDTO> getNotebookTimeline(Long notebookId) {
        List<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateIdOrderByCreatedAtDesc("NOTEBOOK", notebookId);
        
        return events.stream()
            .filter(event -> !isObservationUpdate(event))
            .map(this::toEventStoreDTO)
            .collect(Collectors.toList());
    }

    public List<EventStoreDTO> getEmployeeTimeline(Long employeeId) {
        List<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateIdOrderByCreatedAtDesc("EMPLOYEE", employeeId);
        
        return events.stream()
            .map(this::toEventStoreDTO)
            .collect(Collectors.toList());
    }

    public List<EventStoreDTO> getNotebookMaintenanceHistory(Long notebookId) {
        List<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateIdAndEventTypeIn(
                "NOTEBOOK", notebookId, 
                List.of(EventTypes.NOTEBOOK_MAINTENANCE_ADDED.name(), 
                       EventTypes.NOTEBOOK_MAINTENANCE_COMPLETED.name())
            );
        
        return events.stream()
            .map(this::toEventStoreDTO)
            .collect(Collectors.toList());
    }

    public List<EventStoreDTO> getNotebookAssignmentHistory(Long notebookId) {
        List<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateIdAndEventTypeIn(
                "NOTEBOOK", notebookId,
                List.of(EventTypes.NOTEBOOK_ASSIGNED.name(), 
                       EventTypes.NOTEBOOK_UNASSIGNED.name())
            );
        
        return events.stream()
            .map(this::toEventStoreDTO)
            .collect(Collectors.toList());
    }

    public List<EventStoreDTO> getEmployeeLicenseHistory(Long employeeId) {
        List<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateIdAndEventTypeIn(
                "EMPLOYEE", employeeId,
                List.of(EventTypes.LICENSE_ADDED.name(), 
                       EventTypes.LICENSE_REMOVED.name())
            );
        
        return events.stream()
            .map(this::toEventStoreDTO)
            .collect(Collectors.toList());
    }

    public Page<EventStoreDTO> getNotebookTimelinePaginated(Long notebookId, Pageable pageable) {
        Page<EventStore> events = eventStoreRepository
            .findByAggregateTypeAndAggregateId("NOTEBOOK", notebookId, pageable);
        
        return events.map(this::toEventStoreDTO);
    }

    // Métodos auxiliares

    private EventStoreDTO toEventStoreDTO(EventStore event) {
        return EventStoreDTO.builder()
            .id(event.getId())
            .eventId(event.getEventId())
            .eventType(event.getEventType())
            .aggregateType(event.getAggregateType())
            .aggregateId(event.getAggregateId())
            .eventData(event.getEventData())
            .metadata(event.getMetadata())
            .createdAt(event.getCreatedAt())
            .createdBy(event.getCreatedBy())
            .displayText(formatDisplayText(event))
            .build();
    }

    private boolean isObservationUpdate(EventStore event) {
        return "NOTEBOOK_SPEC_UPDATED".equals(event.getEventType())
            && "Observações".equals(event.getEventData().get("field"));
    }

    private String formatDisplayText(EventStore event) {
        Map<String, Object> data = event.getEventData();
        String eventType = event.getEventType();
        String notebookName = data.get("notebookName") != null
            ? String.valueOf(data.get("notebookName"))
            : notebookRepository.findById(event.getAggregateId())
                .map(Notebook::getName)
                .orElse(String.valueOf(data.getOrDefault("notebookSerial", data.get("serialNumber"))));
        
        return switch (eventType) {
            // Notebook events
            case "NOTEBOOK_CREATED" -> 
                "Notebook criado: " + notebookName;
                
            case "NOTEBOOK_ASSIGNED" -> 
                "Notebook " + notebookName + " atribuído a " + 
                data.get("employeeName") + " - Motivo: " + data.get("reason");
                
            case "NOTEBOOK_UNASSIGNED" -> 
                "Notebook " + notebookName + " removido de " + 
                data.get("employeeName") + " - Motivo: " + data.get("reason");
                
            case "NOTEBOOK_INACTIVATED" -> 
                "Notebook " + notebookName + " inativado - Motivo: " + 
                data.get("reason") + (data.get("details") != null ? 
                " - Detalhes: " + data.get("details") : "");
                
            case "NOTEBOOK_REACTIVATED" -> 
                "Notebook " + notebookName + " reativado - Motivo: " + 
                data.get("reason");

            case "NOTEBOOK_STATUS_CHANGED" ->
                "Status do notebook " + notebookName + " alterado\n" +
                "De: " + formatNotebookStatus(data.get("previousStatus")) + "\n" +
                "Para: " + formatNotebookStatus(data.get("newStatus"));
                
            case "NOTEBOOK_MAINTENANCE_ADDED" -> 
                "Manutenção no notebook " + notebookName + "\n" +
                "Tipo: " + data.get("type") + "\n" +
                "Defeito: " + data.get("defect") + "\n" +
                "Solução: " + data.get("solution");
                
            case "NOTEBOOK_MAINTENANCE_COMPLETED" -> 
                "Manutenção concluída no notebook " + notebookName + "\n" +
                "Solução: " + data.get("solution");
                
            case "NOTEBOOK_SPEC_UPDATED" -> 
                "Especificação do notebook " + notebookName + " atualizada\n" +
                "Campo: " + data.get("field") + "\n" +
                "De: " + data.get("oldValue") + "\n" +
                "Para: " + data.get("newValue") + "\n" +
                "Motivo: " + data.get("reason");
                
            // Employee events
            case "LICENSE_ADDED" -> 
                "Licença " + data.get("license") + " adicionada para " + 
                data.get("employeeName") + " - Motivo: " + data.get("reason");
                
            case "LICENSE_REMOVED" -> 
                "Licença " + data.get("license") + " removida de " + 
                data.get("employeeName") + " - Motivo: " + data.get("reason");
                
            case "EMPLOYEE_COST_CENTER_CHANGED" -> 
                "Centro de custo de " + data.get("employeeName") + 
                " alterado: " + data.get("oldCostCenter") + " → " + 
                data.get("newCostCenter") + " - Motivo: " + data.get("reason");
                
            case "EMPLOYEE_STATUS_CHANGED" -> 
                "Status de " + data.get("employeeName") + 
                " alterado: " + data.get("oldStatus") + " → " + 
                data.get("newStatus") + " - Motivo: " + data.get("reason");
                
            default -> 
                eventType + " - " + data.toString();
        };
    }

    private String formatNotebookStatus(Object status) {
        return switch (String.valueOf(status)) {
            case "ACTIVE" -> "Ativo";
            case "INACTIVE" -> "Inativo";
            case "MAINTENANCE" -> "Em manutenção";
            case "BACKUP" -> "Backup";
            case "REVERSE" -> "Em coleta";
            default -> String.valueOf(status);
        };
    }

    private Map<String, Object> getMetadata(String createdBy) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("createdBy", createdBy != null ? createdBy : "Sistema");
        metadata.put("timestamp", LocalDateTime.now());
        return metadata;
    }

}