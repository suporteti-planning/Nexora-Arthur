package nexora.planning.nexora.service;

import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

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

    public UserDetails loadUserByEmail(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    public UserDetails loadUserByMicrosoftId(String microsoftId) throws UsernameNotFoundException {
        return userRepository.findByMicrosoftId(microsoftId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário Microsoft não encontrado: " + microsoftId));
    }
}