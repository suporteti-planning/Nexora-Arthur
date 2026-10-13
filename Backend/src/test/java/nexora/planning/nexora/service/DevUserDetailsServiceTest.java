package nexora.planning.nexora.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class DevUserDetailsServiceTest {

    @Test
    void loadUserByUsername_shouldReturnEncodedPasswordThatMatchesConfiguredPassword() {
        DevUserDetailsService service = new DevUserDetailsService();
        ReflectionTestUtils.setField(service, "devUsername", "admin");
        ReflectionTestUtils.setField(service, "devPassword", "admin");
        ReflectionTestUtils.setField(service, "devRole", "ROLE_ADMIN");

        UserDetails userDetails = service.loadUserByUsername("admin");

        assertThat(userDetails.getPassword()).isNotEqualTo("admin");
        assertThat(new BCryptPasswordEncoder().matches("admin", userDetails.getPassword())).isTrue();
    }
}
