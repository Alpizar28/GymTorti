package com.mastergym.backend.client.dto;

import com.mastergym.backend.common.enums.ClientStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ClientUpdateRequest {
    @Size(max = 120, message = "nombre supera el maximo (120)")
    private String nombre;

    @Pattern(regexp = "\\d{9}", message = "cedula debe tener 9 digitos")
    private String cedula;

    @Size(max = 120, message = "apellido supera el maximo (120)")
    private String apellido;

    @Pattern(regexp = "\\+?[1-9]\\d{7,14}", message = "telefono invalido")
    @Size(max = 40, message = "telefono supera el maximo (40)")
    private String telefono;

    @Email(message = "email invalido")
    @Size(max = 180, message = "email supera el maximo (180)")
    private String email;

    @Size(max = 500, message = "notas supera el maximo (500)")
    private String notas;

    private ClientStatus estado;

    public ClientUpdateRequest() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre == null ? null : nombre.trim(); }

    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = normalizeDigits(cedula); }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = blankToNull(apellido); }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = normalizePhone(telefono); }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = blankToNull(email); }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = blankToNull(notas); }

    public ClientStatus getEstado() { return estado; }
    public void setEstado(ClientStatus estado) { this.estado = estado; }

    @AssertTrue(message = "nombre no puede ser vacio")
    public boolean isNombreValid() {
        return nombre == null || !nombre.trim().isBlank();
    }

    private static String normalizePhone(String value) {
        String trimmed = blankToNull(value);
        if (trimmed == null) return null;
        String normalized = trimmed.replaceAll("[^0-9+]", "");
        if (normalized.startsWith("+")) {
            return "+" + normalized.substring(1).replaceAll("\\D", "");
        }
        return normalized.replaceAll("\\D", "");
    }

    private static String normalizeDigits(String value) {
        String trimmed = blankToNull(value);
        if (trimmed == null) return null;
        return trimmed.replaceAll("\\D", "");
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
