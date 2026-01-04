package com.mastergym.backend.config;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

import java.io.InputStream;
import java.util.Properties;

@TestConfiguration
public class TestMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            private Session session() {
                return Session.getInstance(new Properties());
            }

            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage(session());
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) {
                try {
                    return new MimeMessage(session(), contentStream);
                } catch (MessagingException ex) {
                    return createMimeMessage();
                }
            }

            @Override
            public void send(MimeMessage mimeMessage) {
                // no-op for tests
            }

            @Override
            public void send(MimeMessage... mimeMessages) {
                // no-op for tests
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) {
                // no-op for tests
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) {
                // no-op for tests
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) {
                // no-op for tests
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) {
                // no-op for tests
            }
        };
    }
}
