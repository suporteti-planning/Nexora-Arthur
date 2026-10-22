package nexora.planning.nexora;

import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import nexora.planning.nexora.enums.TeamRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
@Profile("dev")
public class DevInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev.username}")
    private String adminUsername;

    @Value("${app.dev.password}")
    private String adminPassword;

    @Value("${app.dev.role}")
    private String adminRole;

    public DevInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            if (!userRepository.existsByUsername(adminUsername)) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setEmail("admin@localhost.com");
                admin.setFullName("Administrador DEV");
                admin.setRole(adminRole);
                admin.setAuthProvider("LOCAL");
                admin.setCreatedAt(LocalDateTime.now());
                admin.setUpdatedAt(LocalDateTime.now());
                admin.setActive(true);
                
                // Adicionar todas as team roles para acesso completo
                java.util.Set<nexora.planning.nexora.enums.TeamRole> allRoles = new java.util.HashSet<>();
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_TI);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_DOC);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_DOC);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_RH);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_RH);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_DP);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_DP);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_FINANCEIRO);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_FINANCEIRO);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_RISCO);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_RISCO);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_FISCAL);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_FISCAL);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_CONTABIL);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_CONTABIL);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_DEV);
                allRoles.add(nexora.planning.nexora.enums.TeamRole.ROLE_ADMIN_DEV);
                admin.setTeamRoles(allRoles);

                userRepository.save(admin);

                System.out.println("=========================================");
                System.out.println("USUÁRIO ADMIN CRIADO!");
                System.out.println("=========================================");
                System.out.println("Usuário: " + adminUsername);
                System.out.println("Senha: " + adminPassword);
                System.out.println("Role: " + adminRole);
                System.out.println("Roles de Equipe: " + allRoles.size() + " roles");
                System.out.println("=========================================");
            } else {
                System.out.println("Usuário '" + adminUsername + "' já existe");
            }
        } catch (Exception e) {
            System.err.println("Erro ao criar usuário admin: " + e.getMessage());
        }
    }
}