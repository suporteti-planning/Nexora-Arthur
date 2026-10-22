package nexora.planning.nexora.service;

import nexora.planning.nexora.model.User;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class MicrosoftOidcUserService
        implements org.springframework.security.oauth2.client.userinfo.OAuth2UserService<OidcUserRequest, OidcUser> {

    private final OidcUserService delegate = new OidcUserService();
    private final AuthenticationService authenticationService;

    public MicrosoftOidcUserService(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = delegate.loadUser(userRequest);
        String email = oidcUser.getEmail();
        if (email == null || email.isBlank()) {
            Object preferredUsername = oidcUser.getClaim("preferred_username");
            email = preferredUsername instanceof String value ? value : null;
        }
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("invalid_user_info"),
                "A Microsoft não retornou um email utilizável para esta conta."
            );
        }

        User user;
        try {
            user = authenticationService.authenticateMicrosoftUser(
                oidcUser.getSubject(),
                email,
                oidcUser.getFullName()
            );
        } catch (DisabledException exception) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("access_denied"),
                exception.getMessage(),
                exception
            );
        }
        Set<GrantedAuthority> authorities = new HashSet<>(oidcUser.getAuthorities());
        authorities.addAll(user.getAuthorities());

        return new DefaultOidcUser(
            authorities,
            oidcUser.getIdToken(),
            oidcUser.getUserInfo(),
            IdTokenClaimNames.SUB
        );
    }
}
