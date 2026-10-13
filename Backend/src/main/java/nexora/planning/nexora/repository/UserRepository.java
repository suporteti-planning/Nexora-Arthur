package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

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
        select u from User u
        where u.active = true
          and u.email is not null
          and trim(u.email) <> ''
          and (
            lower(u.username) like lower(concat('%', :search, '%'))
            or lower(u.email) like lower(concat('%', :search, '%'))
            or lower(coalesce(u.fullName, '')) like lower(concat('%', :search, '%'))
          )
        order by lower(coalesce(u.fullName, u.username)), lower(u.username)
        """)
    Page<User> searchActiveUsers(@Param("search") String search, Pageable pageable);
}
