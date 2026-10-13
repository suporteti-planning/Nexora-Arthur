package nexora.planning.nexora.service;

import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * UserDetailsService para perfil prod.
 * Em prod: carrega sempre do banco; roles reais armazenados na coluna `role`.
 */
@Service
@Primary
@Profile("prod")
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
    }

    public UserDetails loadUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    public UserDetails loadUserByMicrosoftId(String microsoftId) {
        return userRepository.findByMicrosoftId(microsoftId)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário Microsoft não encontrado: " + microsoftId));
    }
}
