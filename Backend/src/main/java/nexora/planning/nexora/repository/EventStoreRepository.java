package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.EventStore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStore, Long> {

    // Buscar eventos por agregado
    List<EventStore> findByAggregateTypeAndAggregateIdOrderByCreatedAtDesc(
        String aggregateType, Long aggregateId);

    // Buscar eventos com paginação
    Page<EventStore> findByAggregateTypeAndAggregateId(
        String aggregateType, Long aggregateId, Pageable pageable);

    // Buscar eventos por tipo
    List<EventStore> findByAggregateTypeAndAggregateIdAndEventTypeIn(
        String aggregateType, Long aggregateId, List<String> eventTypes);

    // Buscar eventos por período (com índice)
    @Query("SELECT e FROM EventStore e WHERE e.aggregateType = :type AND e.aggregateId = :id " +
           "AND e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<EventStore> findByAggregateAndDateRange(
        @Param("type") String type,
        @Param("id") Long id,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    // Buscar todos os eventos de um notebook incluindo metadados
    @Query(value = "SELECT * FROM event_store e WHERE e.aggregate_type = 'NOTEBOOK' " +
                   "AND e.aggregate_id = :id ORDER BY e.created_at DESC", 
           nativeQuery = true)
    List<EventStore> findAllNotebookEvents(@Param("id") Long id);

    // Contar eventos por tipo (para relatórios)
    @Query("SELECT e.eventType, COUNT(e) FROM EventStore e WHERE e.aggregateType = :type " +
           "AND e.aggregateId = :id GROUP BY e.eventType")
    List<Object[]> countEventsByType(@Param("type") String type, @Param("id") Long id);
}