package com.mastergym.backend.common.security;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final long gymId;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            @Value("${app.security.gym-id}") long gymId
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        if (gymId <= 0) {
            throw new IllegalStateException("app.security.gym-id debe ser mayor a 0");
        }
        this.gymId = gymId;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        JwtService.TokenInfo token = jwtService.generateToken(auth.getName(), gymId);
        return new LoginResponse(token.token(), "Bearer", token.expiresAt().toString());
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record LoginResponse(
            String token,
            String tokenType,
            String expiresAt
    ) {}
}
