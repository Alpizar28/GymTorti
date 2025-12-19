package com.mastergym.backend.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ClientRequest {

    @NotBlank(message = "nombre es obligatorio")
    @Size(max = 120, message = "nombre supera el máximo (120)")
    private String nombre;

    @Size(max = 120, message = "apellido supera el máximo (120)")
    private String apellido;

    @Size(max = 40, message = "telefono supera el máximo (40)")
    private String telefono;

    @Email(message = "email inválido")
    @Size(max = 180, message = "email supera el máximo (180)")
    private String email;

    @Size(max = 500, message = "notas supera el máximo (500)")
    private String notas;

    public ClientRequest() {
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre == null ? null : nombre.trim();
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = blankToNull(apellido);
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = blankToNull(telefono);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = blankToNull(email);
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = blankToNull(notas);
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
