package com.mastergym.backend.client.dto;

import com.mastergym.backend.common.enums.ClientStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ClientResponse {

    private Long id;
    private Long gymId;
    private String nombre;
    private String apellido;
    private String telefono;
    private String email;
    private ClientStatus estado;
    private OffsetDateTime fechaRegistro;
    private LocalDate fechaInicioMembresia;
    private LocalDate fechaVencimiento;
    private String notas;

    public ClientResponse() {
    }

    public ClientResponse(Long id, Long gymId, String nombre, String apellido,
                          String telefono, String email,
                          ClientStatus estado, OffsetDateTime fechaRegistro,
                          LocalDate fechaInicioMembresia, LocalDate fechaVencimiento, String notas) {
        this.id = id;
        this.gymId = gymId;
        this.nombre = nombre;
        this.apellido = apellido;
        this.telefono = telefono;
        this.email = email;
        this.estado = estado;
        this.fechaRegistro = fechaRegistro;
        this.fechaInicioMembresia = fechaInicioMembresia;
        this.fechaVencimiento = fechaVencimiento;
        this.notas = notas;
    }

    public Long getId() {
        return id;
    }

    public Long getGymId() {
        return gymId;
    }

    public String getNombre() {
        return nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getEmail() {
        return email;
    }

    public ClientStatus getEstado() {
        return estado;
    }

    public OffsetDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public LocalDate getFechaInicioMembresia() {
        return fechaInicioMembresia;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public String getNotas() {
        return notas;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setGymId(Long gymId) {
        this.gymId = gymId;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setEstado(ClientStatus estado) {
        this.estado = estado;
    }

    public void setFechaRegistro(OffsetDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public void setFechaInicioMembresia(LocalDate fechaInicioMembresia) {
        this.fechaInicioMembresia = fechaInicioMembresia;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
