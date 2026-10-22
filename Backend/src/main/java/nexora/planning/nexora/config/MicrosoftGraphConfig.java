package nexora.planning.nexora.config;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;

@Slf4j
@Configuration
public class MicrosoftGraphConfig {

    @Value("${AZURE_TENANT_ID:}")
    private String tenantId;

    @Value("${AZURE_CLIENT_ID:}")
    private String clientId;

    @Value("${AZURE_CLIENT_SECRET:}")
    private String clientSecret;

    @Value("${AZURE_ENABLED:false}")
    private String azureEnabled;

    @Bean
    public ClientSecretCredential clientSecretCredential() {
        log.info("Configurando credencial do Microsoft Graph...");
        
        // Verificar se as credenciais estão configuradas
        boolean hasCredentials = tenantId != null && !tenantId.isEmpty() &&
                                 clientId != null && !clientId.isEmpty() &&
                                 clientSecret != null && !clientSecret.isEmpty();
        
        if (!hasCredentials) {
            log.warn("   Credenciais do Microsoft Graph não configuradas!");
            log.warn("   AZURE_TENANT_ID: {}", tenantId != null && !tenantId.isEmpty() ? "✅" : "❌");
            log.warn("   AZURE_CLIENT_ID: {}", clientId != null && !clientId.isEmpty() ? "✅" : "❌");
            log.warn("   AZURE_CLIENT_SECRET: {}", clientSecret != null && !clientSecret.isEmpty() ? "✅" : "❌");
            return null;
        }
        
        try {
            return new ClientSecretCredentialBuilder()
                .clientId(clientId)
                .tenantId(tenantId)
                .clientSecret(clientSecret)
                .build();
        } catch (Exception e) {
            log.error("Erro ao criar credencial: {}", e.getMessage());
            return null;
        }
    }

    @Bean
    public GraphServiceClient graphServiceClient(ClientSecretCredential credential) {
        log.info("Inicializando cliente do Microsoft Graph...");
        
        if (credential == null) {
            log.warn("Credencial não disponível, GraphServiceClient não será criado");
            return null;
        }
        
        try {
            GraphServiceClient client = new GraphServiceClient(credential);
            log.info("GraphServiceClient inicializado com sucesso!");
            return client;
        } catch (Exception e) {
            log.error("Erro ao criar GraphServiceClient: {}", e.getMessage());
            return null;
        }
    }
}