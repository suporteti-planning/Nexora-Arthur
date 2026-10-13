package nexora.planning.nexora.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import nexora.planning.nexora.service.JwtService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@Profile("dev")
public class DevAuthenticationFilter extends OncePerRequestFilter {

    private final ObjectProvider<AuthenticationManager> authenticationManagerProvider;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public DevAuthenticationFilter(
            ObjectProvider<AuthenticationManager> authenticationManagerProvider,
            JwtService jwtService,
            UserDetailsService userDetailsService
    ) {
        this.authenticationManagerProvider = authenticationManagerProvider;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Verifica se é uma requisição de login
        if (request.getRequestURI().equals("/api/auth/dev-login") && 
            request.getMethod().equals("POST")) {
            handleLogin(request, response);
            return;
        }

        // Para outras requisições, verifica o token JWT
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            
            try {
                String username = jwtService.extractUsername(jwt);
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    
                    if (jwtService.isTokenValid(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = 
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (JwtException | IllegalArgumentException e) {
                // Captura tokens malformados, expirados ou inválidos sem estourar Erro 500
                logger.warn("Token JWT inválido ignorado: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response) 
            throws IOException {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> credentials = mapper.readValue(
                    request.getInputStream(), 
                    Map.class
            );

            String username = credentials.get("username");
            String password = credentials.get("password");

            AuthenticationManager authenticationManager = authenticationManagerProvider.getIfAvailable();
            if (authenticationManager == null) {
                throw new IllegalStateException("AuthenticationManager não disponível");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            // Gerar token JWT
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);

            // Retornar resposta com token
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"token\":\"%s\",\"username\":\"%s\",\"role\":\"%s\"}",
                token,
                userDetails.getUsername(),
                userDetails.getAuthorities().iterator().next().getAuthority()
            ));
            response.setStatus(HttpServletResponse.SC_OK);

        } catch (AuthenticationException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Credenciais inválidas\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/api/public/");
    }
}