package com.mastergym.backend.common.audit;

import com.mastergym.backend.common.gym.GymContext;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuditService {

    private static final Logger AUDIT_LOGGER = LoggerFactory.getLogger("AUDIT");

    public void log(String action, String entity, Long entityId, Map<String, Object> details) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("at", OffsetDateTime.now().toString());
        payload.put("action", action);
        payload.put("entity", entity);
        payload.put("entityId", entityId);
        payload.put("username", resolveUsername());
        payload.put("gymId", GymContext.getGymId());
        payload.put("ip", resolveIp());
        if (details != null && !details.isEmpty()) {
            payload.put("details", details);
        }

        AUDIT_LOGGER.info(payload.toString());
    }

    private String resolveUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "anonymous";
        String name = auth.getName();
        return name == null || name.isBlank() ? "anonymous" : name;
    }

    private String resolveIp() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            HttpServletRequest request = servletAttrs.getRequest();
            if (request != null && request.getRemoteAddr() != null) {
                return request.getRemoteAddr();
            }
        }
        return "unknown";
    }
}
