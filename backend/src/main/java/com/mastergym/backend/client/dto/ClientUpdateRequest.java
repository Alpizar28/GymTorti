package com.mastergym.backend.client.dto;

import com.mastergym.backend.common.enums.ClientStatus;

public class ClientUpdateRequest {
    private String nombre;
    private String apellido;
    private String telefono;
    private String email;
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
}
