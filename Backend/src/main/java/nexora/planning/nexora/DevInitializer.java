package nexora.planning.nexora;

import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("dev")
public class DevInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.dev.username:admin}")
    private String devUsername;

    @Value("${app.dev.password:admin}")
    private String devPassword;

    @Value("${app.dev.role:ROLE_TI}")
    private String devRole;

    public DevInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            if (!userRepository.existsByUsername(devUsername)) {
                User admin = new User();
                admin.setUsername(devUsername);
                admin.setPassword(passwordEncoder.encode(devPassword));
                admin.setEmail("admin@localhost.com");
                admin.setFullName("Administrador DEV");

                // Determina o TeamRole a partir do devRole configurado
                TeamRole teamRole = TeamRole.fromString(devRole);
                admin.setTeamRole(teamRole);   // sincroniza role também
                admin.setIsTeamMember(true);
                admin.setDepartment("TI");

                admin.setAuthProvider("LOCAL");
                admin.setCreatedAt(LocalDateTime.now());
                admin.setUpdatedAt(LocalDateTime.now());
                admin.setActive(true);

                userRepository.save(admin);

                System.out.println("=========================================");
                System.out.println("USUÁRIO ADMIN CRIADO!");
                System.out.println("=========================================");
                System.out.println("Usuário: " + devUsername);
                System.out.println("Senha:   " + devPassword);
                System.out.println("Role:    " + teamRole.name());
                System.out.println("=========================================");
            } else {
                System.out.println("Usuário '" + devUsername + "' já existe");
            }
        } catch (Exception e) {
            System.err.println("Erro ao criar usuário admin: " + e.getMessage());
        }
    }
}