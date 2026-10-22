package nexora.planning.nexora.repository;

import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.model.Employee;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByCostCenter(costCenter costCenter);
    List<Employee> findByStatus(EmployeeStatus status);
    List<Employee> findByStatusAndCostCenter(EmployeeStatus status, costCenter costCenter);
    
    // Buscar funcionários que têm UMA OU MAIS das licenças
    @Query("SELECT DISTINCT e FROM Employee e JOIN e.microsoftLicenses l WHERE l IN :licenses")
    List<Employee> findByMicrosoftLicensesIn(@Param("licenses") List<MicrosoftLicense> licenses);
    
    // Buscar funcionários que têm uma licença específica
    @Query("SELECT DISTINCT e FROM Employee e JOIN e.microsoftLicenses l WHERE l = :license")
    List<Employee> findByMicrosoftLicense(@Param("license") MicrosoftLicense license);

    @EntityGraph(attributePaths = {"notebook", "microsoftLicenses"})
    @Query("SELECT e FROM Employee e")
    List<Employee> findAllWithGraph();
    
    boolean existsByCpf(String cpf);
    boolean existsByEmail(String email);

    Optional<Employee> findByEmail(String email);
    List<Employee> findAllByEmailIn(Collection<String> emails);

    @Query("""
        select employee from Employee employee
        where employee.status = nexora.planning.nexora.enums.EmployeeStatus.ACTIVE
          and (
            lower(employee.name) like lower(concat('%', :search, '%'))
            or lower(employee.email) like lower(concat('%', :search, '%'))
            or lower(employee.position) like lower(concat('%', :search, '%'))
          )
        order by lower(employee.name), lower(employee.email)
        """)
    Page<Employee> searchActiveEmployees(@Param("search") String search, Pageable pageable);
}