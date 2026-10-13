package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.MicrosoftSyncResult;
import nexora.planning.nexora.service.MicrosoftSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class MicrosoftSyncController {

    private final MicrosoftSyncService microsoftSyncService;

    @PostMapping("/users")
    public ResponseEntity<MicrosoftSyncResult> syncUsers() {
        log.info("Recebida solicitação de sincronização de usuários");
        
        try {
            MicrosoftSyncResult result = microsoftSyncService.syncAllUsers();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro na sincronização: {}", e.getMessage());
            MicrosoftSyncResult errorResult = new MicrosoftSyncResult();
            errorResult.setSuccess(false);
            errorResult.setErrorMessage(e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
}