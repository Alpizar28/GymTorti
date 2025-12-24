package com.mastergym.backend.client.model;

import com.mastergym.backend.common.enums.ClientStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "clients")
public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(nullable = false)
    private String nombre;

    private String apellido;
    private String telefono;
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClientStatus estado = ClientStatus.INACTIVO;

    @Column(name = "fecha_registro", nullable = false)
    private OffsetDateTime fechaRegistro = OffsetDateTime.now();

    @Column(name = "fecha_inicio_membresia")
    private LocalDate fechaInicioMembresia;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    private String notas;

    public ClientEntity() {
    }

    public ClientEntity(Long gymId, String nombre, String apellido,
                        String telefono, String email, String notas) {
        this.gymId = gymId;
        this.nombre = nombre;
        this.apellido = apellido;
        this.telefono = telefono;
        this.email = email;
        this.notas = notas;
        this.estado = ClientStatus.INACTIVO;
        this.fechaRegistro = OffsetDateTime.now();
    }

    // Getters y setters

    public Long getId() {
        return id;
    }

    public Long getGymId() {
        return gymId;
    }

    public void setGymId(Long gymId) {
        this.gymId = gymId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public ClientStatus getEstado() {
        return estado;
    }

    public void setEstado(ClientStatus estado) {
        this.estado = estado;
    }

    public OffsetDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(OffsetDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public LocalDate getFechaInicioMembresia() {
        return fechaInicioMembresia;
    }

    public void setFechaInicioMembresia(LocalDate fechaInicioMembresia) {
        this.fechaInicioMembresia = fechaInicioMembresia;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
