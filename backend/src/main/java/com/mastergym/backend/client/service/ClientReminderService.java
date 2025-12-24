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

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ClientReminderService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ClientRepository clientRepository;
    private final JavaMailSender mailSender;

    private final String mailFrom;
    private final String mailFromName;
    private final String mailUsername;

    public ClientReminderService(
            ClientRepository clientRepository,
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String mailFrom,
            @Value("${app.mail.from-name:MasterGym}") String mailFromName,
            @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.clientRepository = clientRepository;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.mailFromName = mailFromName;
        this.mailUsername = mailUsername;
    }

    public void sendReminder(Long clientId) {
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(clientId, gymId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));

        String toEmail = safeTrim(client.getEmail());
        if (toEmail == null) {
            throw new BadRequestException("El cliente no tiene correo registrado");
        }

        String fromEmail = safeTrim(mailFrom);
        if (fromEmail == null) {
            fromEmail = safeTrim(mailUsername);
        }
        if (fromEmail == null) {
            throw new BadRequestException("MAIL_FROM no esta configurado");
        }

        String subject = "Recordatorio de membresia - MasterGym";
        String body = buildBody(client);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setTo(toEmail);
            helper.setFrom(new InternetAddress(fromEmail, mailFromName));
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException ex) {
            throw new RuntimeException("No se pudo enviar el correo", ex);
        }
    }

    private String buildBody(ClientEntity client) {
        String nombre = client.getNombre();
        String apellido = client.getApellido() != null ? client.getApellido() : "";
        LocalDate vencimiento = client.getFechaVencimiento();
        String vencimientoTexto = vencimiento != null ? vencimiento.format(DATE_FORMAT) : "Sin membresia activa";

        StringBuilder sb = new StringBuilder();
        sb.append("Hola ").append(nombre).append(" ").append(apellido).append(",\n\n");
        sb.append("Te recordamos el estado de tu membresia en MasterGym.\n");
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
