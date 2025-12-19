package com.mastergym.backend.client.dto;

import com.mastergym.backend.common.enums.ClientStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class ClientUpdateRequest {
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
    private ClientStatus estado;

    public ClientUpdateRequest() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public ClientStatus getEstado() { return estado; }
    public void setEstado(ClientStatus estado) { this.estado = estado; }

    @AssertTrue(message = "nombre no puede ser vacío")
    public boolean isNombreValid() {
        return nombre == null || !nombre.trim().isBlank();
    }
}
