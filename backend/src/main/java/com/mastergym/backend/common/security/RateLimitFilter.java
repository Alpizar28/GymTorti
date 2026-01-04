package com.mastergym.backend.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final int loginMaxAttempts;
    private final Duration loginWindow;
    private final int backupMaxRequests;
    private final Duration backupWindow;
    private final int writeMaxRequests;
    private final Duration writeWindow;

    public RateLimitFilter(
            RateLimitService rateLimitService,
            @Value("${app.security.rate-limit.login.max-attempts:5}") int loginMaxAttempts,
            @Value("${app.security.rate-limit.login.window-seconds:300}") long loginWindowSeconds,
            @Value("${app.security.rate-limit.backup.max-requests:5}") int backupMaxRequests,
            @Value("${app.security.rate-limit.backup.window-seconds:3600}") long backupWindowSeconds,
            @Value("${app.security.rate-limit.write.max-requests:120}") int writeMaxRequests,
            @Value("${app.security.rate-limit.write.window-seconds:60}") long writeWindowSeconds
    ) {
        this.rateLimitService = rateLimitService;
        this.loginMaxAttempts = loginMaxAttempts;
        this.loginWindow = Duration.ofSeconds(loginWindowSeconds);
        this.backupMaxRequests = backupMaxRequests;
        this.backupWindow = Duration.ofSeconds(backupWindowSeconds);
        this.writeMaxRequests = writeMaxRequests;
        this.writeWindow = Duration.ofSeconds(writeWindowSeconds);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (path == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if ("/api/auth/login".equals(path)) {
            if (!rateLimitService.tryAcquire(buildKey("login", request), loginMaxAttempts, loginWindow)) {
                reject(response, "Demasiados intentos de login. Intenta mas tarde.");
                return;
            }
        } else if ("/api/backup".equals(path) && "POST".equalsIgnoreCase(method)) {
            if (!rateLimitService.tryAcquire(buildKey("backup", request), backupMaxRequests, backupWindow)) {
                reject(response, "Demasiadas solicitudes de respaldo. Intenta mas tarde.");
                return;
            }
        } else if (path.startsWith("/api/") && isWriteMethod(method)) {
            if (!rateLimitService.tryAcquire(buildKey("write", request), writeMaxRequests, writeWindow)) {
                reject(response, "Demasiadas solicitudes. Intenta mas tarde.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isWriteMethod(String method) {
        if (method == null) return false;
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private String buildKey(String prefix, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        if (ip == null || ip.isBlank()) {
            ip = "unknown";
        }
        return prefix + ":" + ip;
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"" + message + "\"}");
    }
}
