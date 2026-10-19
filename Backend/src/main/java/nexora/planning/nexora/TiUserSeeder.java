package nexora.planning.nexora;

import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Garante que os usuários Admin Master do TI existam no sistema.
 * Roda em TODOS os profiles (dev e prod).
 * - Se o usuário não existe: cria com a senha padrão TI12345@.
 * - Se existe mas não tem ROLE_ADMIN: atualiza o role para ROLE_ADMIN.
 * - Nunca sobrescreve a senha de quem já existe (o usuário pode ter trocado).
 */
@Component
@Order(2) // roda após o DevInitializer (order 1 implícito)
public class TiUserSeeder implements CommandLineRunner {

    private static final String DEFAULT_PASSWORD = "TI12345@";

    record TiUser(String username, String fullName, String email) {}

    private static final List<TiUser> TI_USERS = List.of(
        new TiUser("arthur.alves",   "Arthur Alves",   "arthur.alves@planning.com.br"),
        new TiUser("gustavo.santos", "Gustavo Santos", "gustavo.santos@planning.com.br"),
        new TiUser("jean.henrique",  "Jean Henrique",  "jean.henrique@planning.com.br"),
        new TiUser("joao.marcelo",   "João Marcelo",   "joao.marcelo@planning.com.br"),
        new TiUser("matheus.nere",   "Matheus Nere",   "matheus.nere@planning.com.br")
    );

    private final UserRepository  userRepo;
    private final PasswordEncoder encoder;

    public TiUserSeeder(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder  = encoder;
    }

    @Override
    public void run(String... args) {
        int created = 0, updated = 0;

        for (TiUser def : TI_USERS) {
            Optional<User> existing = userRepo.findByUsername(def.username());

            if (existing.isEmpty()) {
                // Cria novo usuário
                User u = new User();
                u.setUsername(def.username());
                u.setPassword(encoder.encode(DEFAULT_PASSWORD));
                u.setEmail(def.email());
                u.setFullName(def.fullName());
                u.setTeamRole(TeamRole.ROLE_ADMIN);   // sincroniza role também via setter
                u.setDepartment("TI");
                u.setIsTeamMember(true);
                u.setAuthProvider("LOCAL");
                u.setActive(true);
                u.setCreatedAt(LocalDateTime.now());
                u.setUpdatedAt(LocalDateTime.now());
                userRepo.save(u);
                created++;
            } else {
                // Atualiza role se necessário, sem tocar na senha
                User u = existing.get();
                boolean changed = false;
                if (u.getTeamRole() != TeamRole.ROLE_ADMIN) {
                    u.setTeamRole(TeamRole.ROLE_ADMIN);
                    changed = true;
                }
                if (!"TI".equals(u.getDepartment())) {
                    u.setDepartment("TI");
                    changed = true;
                }
                if (!u.getIsTeamMember()) {
                    u.setIsTeamMember(true);
                    changed = true;
                }
                if (changed) {
                    u.setUpdatedAt(LocalDateTime.now());
                    userRepo.save(u);
                    updated++;
                }
            }
        }

        if (created > 0 || updated > 0) {
            System.out.println("=========================================");
            System.out.println("TI USER SEEDER");
            System.out.println("Criados: " + created + " | Atualizados: " + updated);
            System.out.println("Senha padrão: " + DEFAULT_PASSWORD);
            System.out.println("=========================================");
        }
    }
}
