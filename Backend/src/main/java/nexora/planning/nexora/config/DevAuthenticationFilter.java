package nexora.planning.nexora.config;
import nexora.planning.nexora.model.User;

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
import java.util.LinkedHashMap;
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

    private void handleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> credentials = mapper.readValue(request.getInputStream(), Map.class);

            AuthenticationManager am = authenticationManagerProvider.getIfAvailable();
            if (am == null) throw new IllegalStateException("AuthenticationManager não disponível");

            Authentication auth = am.authenticate(
                new UsernamePasswordAuthenticationToken(credentials.get("username"), credentials.get("password"))
            );

            User user = (User) auth.getPrincipal();   // ← cast pra User pra ler teamRoles
            String token = jwtService.generateToken(user);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("token", token);
            body.put("username", user.getUsername());
            body.put("role", user.getRole());
            body.put("email", user.getEmail());
            body.put("fullName", user.getFullName());
            body.put("userId", user.getId());
            body.put("authProvider", user.getAuthProvider());
            body.put("teamRoles", user.getTeamRoles().stream().map(Enum::name).toList()); 
            body.put("department", user.getDepartment());

            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(mapper.writeValueAsString(body));
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