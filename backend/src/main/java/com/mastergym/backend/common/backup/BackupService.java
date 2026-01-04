package com.mastergym.backend.common.backup;

import org.springframework.beans.factory.annotation.Value;
import com.mastergym.backend.common.audit.AuditService;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Service
public class BackupService {

    private final String scriptPath;
    private final String backupToken;
    private final AuditService auditService;

    public BackupService(
            @Value("${app.backup.script-path:scripts/backup_to_neon.ps1}") String scriptPath,
            @Value("${app.backup.token:}") String backupToken,
            AuditService auditService
    ) {
        this.scriptPath = scriptPath;
        this.backupToken = backupToken;
        this.auditService = auditService;
    }

    public BackupResponse run(String providedToken) {
        if (!backupToken.isBlank()) {
            if (providedToken == null || !backupToken.equals(providedToken)) {
                auditService.log("BACKUP", "backup", null, Map.of("success", false, "reason", "invalid_token"));
                return new BackupResponse(false, -1, "Token de respaldo invalido.");
            }
        }

        Path path = Paths.get(scriptPath);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(scriptPath);
        }
        if (!Files.exists(path)) {
            auditService.log("BACKUP", "backup", null, Map.of("success", false, "reason", "script_not_found"));
            return new BackupResponse(false, -1, "No se encontro el script de respaldo.");
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "powershell",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    path.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append(System.lineSeparator());
                }
            }

            int exitCode = process.waitFor();
            String out = trimOutput(output.toString());
            if (exitCode != 0) {
                auditService.log("BACKUP", "backup", null, Map.of("success", false, "exitCode", exitCode));
                return new BackupResponse(false, exitCode, out.isBlank() ? "Respaldo fallo." : out);
            }
            auditService.log("BACKUP", "backup", null, Map.of("success", true, "exitCode", exitCode));
            return new BackupResponse(true, exitCode, out);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            auditService.log("BACKUP", "backup", null, Map.of("success", false, "reason", "exception"));
            return new BackupResponse(false, -1, msg == null || msg.isBlank() ? "No se pudo ejecutar el respaldo." : msg);
        }
    }

    private String trimOutput(String output) {
        if (output == null) return null;
        int max = 2000;
        if (output.length() <= max) return output.trim();
        return output.substring(output.length() - max).trim();
    }
}
