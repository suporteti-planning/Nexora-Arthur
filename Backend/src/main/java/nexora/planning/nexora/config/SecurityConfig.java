package nexora.planning.nexora.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)   // habilita @PreAuthorize
public class SecurityConfig {

    @Value("${app.environment:dev}")
    private String environment;

    @Value("${cors.allowed-origins:http://localhost:4200,http://localhost:5173}")
    private String[] allowedOrigins;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final DevAuthenticationFilter devAuthenticationFilter;

    @Autowired(required = false)
    private ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          DevAuthenticationFilter devAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.devAuthenticationFilter = devAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // ── DEV ──────────────────────────────────────────────────────────────────

    @Bean @Order(1) @Profile("dev")
    public SecurityFilterChain devFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**")
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                // Auth público
                .requestMatchers(
                    "/api/auth/dev-login",
                    "/api/auth/dev-register",
                    "/api/auth/environment",
                    "/api/public/**",
                    "/api/auth/**"
                ).permitAll()
                // Catálogo DOC — autenticado (não sensível)
                .requestMatchers("/api/doc/catalog/**").authenticated()
                // Admin de usuários — apenas TI / Admin
                .requestMatchers("/api/admin/users/**").hasAnyRole("TI", "ADMIN")
                // Chamados — regras por role via @PreAuthorize nos métodos
                .requestMatchers("/api/tickets/**").authenticated()
                // Endpoints legados (employees, notebooks, events, sync)
                .requestMatchers(
                    "/api/employees", "/api/employees/**",
                    "/api/notebooks", "/api/notebooks/**",
                    "/api/events",    "/api/events/**",
                    "/api/sync/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(devAuthenticationFilter,  UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter,  UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── PROD ─────────────────────────────────────────────────────────────────

    @Bean @Order(2) @Profile("prod")
    public SecurityFilterChain prodFilterChain(HttpSecurity http) throws Exception {
        if (clientRegistrationRepository == null)
            throw new IllegalStateException("ClientRegistrationRepository não disponível.");

        http
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .csrf(c -> c.disable())
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/public/**",
                    "/api/auth/microsoft-success",
                    "/api/auth/microsoft-failure").permitAll()
                .requestMatchers("/api/admin/users/**").hasAnyRole("TI", "ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(o -> o
                .loginPage("/oauth2/authorization/azure")
                .defaultSuccessUrl("/api/auth/microsoft-success", true)
                .failureUrl("/api/auth/microsoft-failure")
            )
            .logout(l -> l
                .logoutSuccessHandler(oidcLogoutSuccessHandler())
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }

    private OidcClientInitiatedLogoutSuccessHandler oidcLogoutSuccessHandler() {
        if (clientRegistrationRepository == null)
            throw new IllegalStateException("ClientRegistrationRepository não disponível.");
        OidcClientInitiatedLogoutSuccessHandler h =
            new OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository);
        h.setPostLogoutRedirectUri("http://localhost:4200");
        return h;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.asList(allowedOrigins));
        cfg.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
        cfg.setAllowedHeaders(Arrays.asList("*"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
