package nexora.planning.nexora.repository;

import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByMicrosoftId(String microsoftId);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByMicrosoftId(String microsoftId);
    List<User> findByUsernameInAndActiveTrue(Collection<String> usernames);

    @Query("""
        select user from User user
        where user.active = true
          and user.email is not null
          and trim(user.email) <> ''
          and (
            lower(user.username) like lower(concat('%', :search, '%'))
            or lower(user.email) like lower(concat('%', :search, '%'))
            or lower(coalesce(user.fullName, '')) like lower(concat('%', :search, '%'))
          )
        order by lower(coalesce(user.fullName, user.username)), lower(user.username)
        """)
    Page<User> searchActiveUsers(@Param("search") String search, Pageable pageable);

    @Query("""
    SELECT DISTINCT u FROM User u JOIN u.teamRoles r WHERE r IN :roles""")
    Page<User> findByAnyTeamRole(@Param("roles") Set<TeamRole> roles, Pageable pageable);
}