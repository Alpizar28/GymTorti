package com.mastergym.backend.payment.dto;

import com.mastergym.backend.payment.enums.PaymentCurrency;
import com.mastergym.backend.payment.enums.PaymentMethod;
import com.mastergym.backend.payment.enums.PaymentStatus;
import com.mastergym.backend.payment.enums.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentRequest {

    @NotNull(message = "clientId es obligatorio")
    private Long clientId;

    @NotNull(message = "amount es obligatorio")
    @DecimalMin(value = "0.01", message = "amount debe ser mayor a 0")
    @Digits(integer = 10, fraction = 2, message = "amount debe tener hasta 2 decimales")
    private BigDecimal amount;

    private PaymentCurrency currency = PaymentCurrency.CRC;

    @NotNull(message = "paymentMethod es obligatorio")
    private PaymentMethod paymentMethod;

    @NotNull(message = "paymentType es obligatorio")
    private PaymentType paymentType;

    private PaymentStatus status = PaymentStatus.PAID;

    @Size(max = 120, message = "reference supera el máximo (120)")
    private String reference;

    @Size(max = 1000, message = "notes supera el máximo (1000)")
    private String notes;

    @NotNull(message = "paymentDate es obligatorio")
    private LocalDate paymentDate;

    public PaymentRequest() {}

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentCurrency getCurrency() {
        return currency;
    }

    public void setCurrency(PaymentCurrency currency) {
        this.currency = currency;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentType getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(PaymentType paymentType) {
        this.paymentType = paymentType;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = blankToNull(reference);
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = blankToNull(notes);
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

