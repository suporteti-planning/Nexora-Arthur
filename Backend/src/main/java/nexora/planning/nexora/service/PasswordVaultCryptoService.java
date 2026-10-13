package nexora.planning.nexora.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class PasswordVaultCryptoService {
    private static final int NONCE_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final String PREFIX = "v1:";

    private final String encodedKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordVaultCryptoService(@Value("${vault.encryption-key:}") String encodedKey) {
        this.encodedKey = encodedKey;
    }

    public String encrypt(String plaintext) {
        byte[] nonce = new byte[NONCE_LENGTH];
        secureRandom.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] payload = ByteBuffer.allocate(nonce.length + ciphertext.length).put(nonce).put(ciphertext).array();
            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Não foi possível criptografar a senha do cofre.", e);
        }
    }

    public String decrypt(String encryptedValue) {
        if (encryptedValue == null || !encryptedValue.startsWith(PREFIX)) {
            throw new IllegalStateException("Formato de senha criptografada não reconhecido.");
        }

        try {
            byte[] payload = Base64.getDecoder().decode(encryptedValue.substring(PREFIX.length()));
            if (payload.length <= NONCE_LENGTH) throw new IllegalStateException("Senha criptografada inválida.");
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            byte[] nonce = new byte[NONCE_LENGTH];
            buffer.get(nonce);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), java.nio.charset.StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Não foi possível descriptografar a senha do cofre.", e);
        }
    }

    private SecretKeySpec encryptionKey() {
        if (encodedKey == null || encodedKey.isBlank()) {
            throw new IllegalStateException("Configure VAULT_ENCRYPTION_KEY com uma chave Base64 de 32 bytes antes de usar o cofre.");
        }
        try {
            byte[] keyBytes = Base64.getDecoder().decode(encodedKey);
            if (keyBytes.length != 32) throw new IllegalStateException("VAULT_ENCRYPTION_KEY deve decodificar para exatamente 32 bytes.");
            return new SecretKeySpec(keyBytes, "AES");
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("VAULT_ENCRYPTION_KEY deve ser uma chave Base64 válida.", e);
        }
    }
}