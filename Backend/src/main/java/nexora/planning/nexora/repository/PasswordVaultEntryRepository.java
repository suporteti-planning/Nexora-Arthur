package nexora.planning.nexora.repository;

import nexora.planning.nexora.model.PasswordVaultEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordVaultEntryRepository extends JpaRepository<PasswordVaultEntry, Long> {
    List<PasswordVaultEntry> findAllByOrderByUpdatedAtDesc();
}