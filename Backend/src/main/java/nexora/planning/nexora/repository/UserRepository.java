package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByMicrosoftId(String microsoftId);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByMicrosoftId(String microsoftId);
}