package com.mastergym.backend.measurement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;

import java.time.LocalDate;

public class MeasurementRequest {

    @NotNull(message = "clientId es obligatorio")
    @Positive(message = "clientId debe ser mayor a 0")
    private Long clientId;

    @NotNull(message = "fecha es obligatoria")
    @PastOrPresent(message = "fecha no puede ser futura")
    private LocalDate fecha;

    @NotNull(message = "peso es obligatorio")
    @DecimalMin(value = "0.01", message = "peso debe ser mayor a 0")
    private Double peso;

    @NotNull(message = "altura es obligatorio")
    @DecimalMin(value = "0.01", message = "altura debe ser mayor a 0")
    private Double altura;

    @NotNull(message = "pechoCm es obligatorio")
    @DecimalMin(value = "0.01", message = "pechoCm debe ser mayor a 0")
    private Double pechoCm;

    @NotNull(message = "cinturaCm es obligatorio")
    @DecimalMin(value = "0.01", message = "cinturaCm debe ser mayor a 0")
    private Double cinturaCm;

    @NotNull(message = "caderaCm es obligatorio")
    @DecimalMin(value = "0.01", message = "caderaCm debe ser mayor a 0")
    private Double caderaCm;

    @NotNull(message = "brazoIzqCm es obligatorio")
    @DecimalMin(value = "0.01", message = "brazoIzqCm debe ser mayor a 0")
    private Double brazoIzqCm;

    @NotNull(message = "brazoDerCm es obligatorio")
    @DecimalMin(value = "0.01", message = "brazoDerCm debe ser mayor a 0")
    private Double brazoDerCm;

    @NotNull(message = "piernaIzqCm es obligatorio")
    @DecimalMin(value = "0.01", message = "piernaIzqCm debe ser mayor a 0")
    private Double piernaIzqCm;

    @NotNull(message = "piernaDerCm es obligatorio")
    @DecimalMin(value = "0.01", message = "piernaDerCm debe ser mayor a 0")
    private Double piernaDerCm;

    @DecimalMin(value = "0", message = "grasaCorporal debe ser mayor o igual a 0")
    @DecimalMax(value = "100", message = "grasaCorporal debe ser menor o igual a 100")
    private Double grasaCorporal;

    @Size(max = 500, message = "notas supera el maximo (500)")
    private String notas;

    public MeasurementRequest() {}

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Double getPeso() {
        return peso;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public Double getAltura() {
        return altura;
    }

    public void setAltura(Double altura) {
        this.altura = altura;
    }

    public Double getPechoCm() {
        return pechoCm;
    }

    public void setPechoCm(Double pechoCm) {
        this.pechoCm = pechoCm;
    }

    public Double getCinturaCm() {
        return cinturaCm;
    }

    public void setCinturaCm(Double cinturaCm) {
        this.cinturaCm = cinturaCm;
    }

    public Double getCaderaCm() {
        return caderaCm;
    }

    public void setCaderaCm(Double caderaCm) {
        this.caderaCm = caderaCm;
    }

    public Double getBrazoIzqCm() {
        return brazoIzqCm;
    }

    public void setBrazoIzqCm(Double brazoIzqCm) {
        this.brazoIzqCm = brazoIzqCm;
    }

    public Double getBrazoDerCm() {
        return brazoDerCm;
    }

    public void setBrazoDerCm(Double brazoDerCm) {
        this.brazoDerCm = brazoDerCm;
    }

    public Double getPiernaIzqCm() {
        return piernaIzqCm;
    }

    public void setPiernaIzqCm(Double piernaIzqCm) {
        this.piernaIzqCm = piernaIzqCm;
    }

    public Double getPiernaDerCm() {
        return piernaDerCm;
    }

    public void setPiernaDerCm(Double piernaDerCm) {
        this.piernaDerCm = piernaDerCm;
    }

    public Double getGrasaCorporal() {
        return grasaCorporal;
    }

    public void setGrasaCorporal(Double grasaCorporal) {
        this.grasaCorporal = grasaCorporal;
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
