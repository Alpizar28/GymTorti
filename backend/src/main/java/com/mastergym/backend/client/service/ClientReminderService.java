package com.mastergym.backend.client.service;

import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.common.error.NotFoundException;
import com.mastergym.backend.common.gym.GymContext;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ClientReminderService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Logger log = LoggerFactory.getLogger(ClientReminderService.class);

    private final ClientRepository clientRepository;
    private final JavaMailSender mailSender;

    private final String mailFrom;
    private final String mailFromName;
    private final String mailUsername;
    private final String mailHost;
    private final boolean remindersEnabled;
    private final int daysBefore;

    public ClientReminderService(
            ClientRepository clientRepository,
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String mailFrom,
            @Value("${app.mail.from-name:MasterGym}") String mailFromName,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${app.mail.reminders.enabled:true}") boolean remindersEnabled,
            @Value("${app.mail.reminders.days-before:3}") int daysBefore
    ) {
        this.clientRepository = clientRepository;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.mailFromName = mailFromName;
        this.mailUsername = mailUsername;
        this.mailHost = mailHost;
        this.remindersEnabled = remindersEnabled;
        this.daysBefore = daysBefore;
    }

    public void sendReminder(Long clientId) {
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(clientId, gymId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));

        sendReminderEmail(client, null, true);
    }

    @Scheduled(cron = "${app.mail.reminders.cron:0 0 9 * * *}")
    public void sendExpiringReminders() {
        if (!remindersEnabled) return;
        if (!isMailConfigured()) {
            log.warn("Recordatorios deshabilitados: configuracion de correo incompleta.");
            return;
        }
        if (daysBefore < 1) return;
        LocalDate targetDate = LocalDate.now().plusDays(daysBefore);
        List<ClientEntity> clients = clientRepository.findByFechaVencimiento(targetDate);
        if (clients.isEmpty()) return;

        int sent = 0;
        for (ClientEntity client : clients) {
            try {
                if (sendReminderEmail(client, daysBefore, false)) {
                    sent += 1;
                }
            } catch (Exception ex) {
                log.warn("No se pudo enviar recordatorio a cliente {}: {}", client.getId(), ex.getMessage());
            }
        }
        if (sent > 0) {
            log.info("Recordatorios enviados: {} (vencen en {} dias)", sent, daysBefore);
        }
    }

    private boolean sendReminderEmail(ClientEntity client, Integer daysLeft, boolean failOnMissingEmail) {
        String toEmail = safeTrim(client.getEmail());
        if (toEmail == null) {
            if (failOnMissingEmail) {
                throw new BadRequestException("El cliente no tiene correo registrado");
            }
            return false;
        }

        String fromEmail = resolveFromEmail();
        if (fromEmail == null) {
            if (failOnMissingEmail) {
                throw new BadRequestException("MAIL_FROM no esta configurado");
            }
            return false;
        }

        String subject = daysLeft == null
                ? "Recordatorio de membresia - MasterGym"
                : "Tu membresia vence en " + daysLeft + " dias";
        String body = buildBody(client, daysLeft);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setTo(toEmail);
            helper.setFrom(new InternetAddress(fromEmail, mailFromName));
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            return true;
        } catch (MessagingException | java.io.UnsupportedEncodingException ex) {
            if (failOnMissingEmail) {
                throw new RuntimeException("No se pudo enviar el correo", ex);
            }
            return false;
        }
    }

    private boolean isMailConfigured() {
        return resolveFromEmail() != null && mailHost != null && !mailHost.isBlank();
    }

    private String resolveFromEmail() {
        String fromEmail = safeTrim(mailFrom);
        if (fromEmail == null) {
            fromEmail = safeTrim(mailUsername);
        }
        return fromEmail;
    }

    private String buildBody(ClientEntity client, Integer daysLeft) {
        String nombre = client.getNombre();
        String apellido = client.getApellido() != null ? client.getApellido() : "";
        LocalDate vencimiento = client.getFechaVencimiento();
        String vencimientoTexto = vencimiento != null ? vencimiento.format(DATE_FORMAT) : "Sin membresia activa";

        StringBuilder sb = new StringBuilder();
        sb.append("Hola ").append(nombre).append(" ").append(apellido).append(",\n\n");
        if (daysLeft != null) {
            sb.append("Tu membresia vence en ").append(daysLeft).append(" dias.\n");
        } else {
            sb.append("Te recordamos el estado de tu membresia en MasterGym.\n");
        }
        sb.append("Vencimiento: ").append(vencimientoTexto).append("\n");
        sb.append("Si necesitas renovar, por favor comunicate con nosotros.\n\n");
        sb.append("Gracias,\n");
        sb.append("MasterGym\n");
        return sb.toString();
    }

    private static String safeTrim(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
