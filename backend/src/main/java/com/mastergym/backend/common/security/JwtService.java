package com.mastergym.backend.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private static final String GYM_ID_CLAIM = "gymId";

    private final SecretKey key;
    private final long tokenMinutes;

    public JwtService(
            @Value("${app.security.jwt-secret}") String secret,
            @Value("${app.security.token-minutes:480}") long tokenMinutes
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("app.security.jwt-secret no esta configurado");
        }
        byte[] bytes = secret.trim().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.security.jwt-secret debe tener al menos 32 caracteres");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.tokenMinutes = tokenMinutes;
    }

    public TokenInfo generateToken(String username, long gymId) {
        if (gymId <= 0) {
            throw new IllegalArgumentException("gymId invalido");
        }
        Instant now = Instant.now();
        Instant expiresAt = now.plus(tokenMinutes, ChronoUnit.MINUTES);
        String token = Jwts.builder()
                .subject(username)
                .claim(GYM_ID_CLAIM, gymId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(key)
                .compact();
        return new TokenInfo(token, expiresAt);
    }

    public String extractUsername(String token) {
        return parseToken(token).getSubject();
    }

    public Long extractGymId(String token) {
        return extractGymId(parseToken(token));
    }

    public Long extractGymId(Claims claims) {
        Number value = claims.get(GYM_ID_CLAIM, Number.class);
        if (value == null) {
            return null;
        }
        long gymId = value.longValue();
        return gymId > 0 ? gymId : null;
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseToken(token);
            return extractGymId(claims) != null;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public Claims parseClaims(String token) {
        return parseToken(token);
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record TokenInfo(String token, Instant expiresAt) {}
}
