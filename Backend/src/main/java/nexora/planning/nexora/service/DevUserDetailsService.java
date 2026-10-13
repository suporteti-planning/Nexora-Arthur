package nexora.planning.nexora.service;

import nexora.planning.nexora.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UserDetailsService para perfil dev.
 * Prioridade: consulta o banco real (onde DevInitializer criou o admin e
 * UserAdminService pode criar outros usuários).
 * Fallback: usuário hardcoded da properties — apenas quando o banco não
 * tem o usuário solicitado (ex: banco vazio na primeira execução).
 */
@Service
@Profile("dev")
public class DevUserDetailsService implements UserDetailsService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.dev.username:admin}")
    private String devUsername;

    @Value("${app.dev.password:admin}")
    private String devPassword;

    @Value("${app.dev.role:ROLE_TI}")
    private String devRole;

    public DevUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tenta carregar do banco (roles reais, status ativo, etc.)
        var dbUser = userRepository.findByUsername(username);
        if (dbUser.isPresent()) {
            return dbUser.get();          // User já implementa UserDetails
        }

        // 2. Fallback: usuário hardcoded das properties (apenas na primeira execução)
        if (devUsername.equals(username)) {
            return User.builder()
                .username(devUsername)
                .password(passwordEncoder.encode(devPassword))
                .authorities(List.of(new SimpleGrantedAuthority(devRole)))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
        }

        throw new UsernameNotFoundException("Usuário não encontrado: " + username);
    }
}
