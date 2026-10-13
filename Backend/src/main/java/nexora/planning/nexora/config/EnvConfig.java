package nexora.planning.nexora.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvEntry;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class EnvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            // Carregar .env da raiz do projeto
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMalformed()
                .ignoreIfMissing()
                .load();

            Map<String, Object> envProperties = new HashMap<>();
            
            // Método correto para obter todas as variáveis
            // Usando dotenv.entries() que retorna um Set<DotenvEntry>
            for (DotenvEntry entry : dotenv.entries()) {
                envProperties.put(entry.getKey(), entry.getValue());
                System.out.println("Carregando .env: " + entry.getKey() + "=" + entry.getValue());
            }

            // Adicionar ao ambiente do Spring
            applicationContext.getEnvironment()
                .getPropertySources()
                .addFirst(new MapPropertySource("dotenv", envProperties));

            System.out.println("Arquivo .env carregado com sucesso!");
            System.out.println("Total de variáveis carregadas: " + envProperties.size());

        } catch (Exception e) {
            System.out.println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema");
            System.out.println("   Erro: " + e.getMessage());
        }
    }
}