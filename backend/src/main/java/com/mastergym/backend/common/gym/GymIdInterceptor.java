package com.mastergym.backend.common.gym;

import com.mastergym.backend.common.error.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class GymIdInterceptor implements HandlerInterceptor {

    public static final String HEADER = "X-GYM-ID";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) return true;
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String raw = request.getHeader(HEADER);
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Falta header X-GYM-ID");
        }

        long gymId;
        try {
            gymId = Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("Header X-GYM-ID inválido");
        }
        if (gymId <= 0) {
            throw new BadRequestException("Header X-GYM-ID inválido");
        }

        GymContext.setGymId(gymId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        GymContext.clear();
    }
}
