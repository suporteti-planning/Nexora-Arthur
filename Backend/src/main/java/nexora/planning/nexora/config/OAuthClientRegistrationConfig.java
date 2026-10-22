package nexora.planning.nexora.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

@Configuration
@ConditionalOnProperty(name = "AZURE_ENABLED", havingValue = "true")
public class OAuthClientRegistrationConfig {

    @Bean
    @ConditionalOnMissingBean(ClientRegistrationRepository.class)
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${AZURE_TENANT_ID:}") String tenantId,
            @Value("${AZURE_CLIENT_ID:}") String clientId,
            @Value("${AZURE_CLIENT_SECRET:}") String clientSecret
    ) {
        if (tenantId.isBlank() || clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException(
                "AZURE_ENABLED=true exige AZURE_TENANT_ID, AZURE_CLIENT_ID e AZURE_CLIENT_SECRET."
            );
        }

        String issuer = "https://login.microsoftonline.com/" + tenantId + "/v2.0";
        String endpoint = "https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0";
        ClientRegistration registration = ClientRegistration.withRegistrationId("azure")
            .clientId(clientId)
            .clientSecret(clientSecret)
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .scope("openid", "profile", "email")
            .authorizationUri(endpoint + "/authorize")
            .tokenUri(endpoint + "/token")
            .userInfoUri("https://graph.microsoft.com/oidc/userinfo")
            .userNameAttributeName("sub")
            .jwkSetUri("https://login.microsoftonline.com/" + tenantId + "/discovery/v2.0/keys")
            .issuerUri(issuer)
            .clientName("Microsoft Entra ID")
            .build();

        return new InMemoryClientRegistrationRepository(registration);
    }
}
