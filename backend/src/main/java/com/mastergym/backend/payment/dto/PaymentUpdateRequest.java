package com.mastergym.backend.payment.dto;

import com.mastergym.backend.payment.enums.PaymentCurrency;
import com.mastergym.backend.payment.enums.PaymentMethod;
import com.mastergym.backend.payment.enums.PaymentStatus;
import com.mastergym.backend.payment.enums.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentUpdateRequest {

    private Long clientId;

    @DecimalMin(value = "0.01", message = "amount debe ser mayor a 0")
    @Digits(integer = 10, fraction = 2, message = "amount debe tener hasta 2 decimales")
    private BigDecimal amount;

    private PaymentCurrency currency;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private PaymentStatus status;

    @Size(max = 120, message = "reference supera el máximo (120)")
    private String reference;

    @Size(max = 1000, message = "notes supera el máximo (1000)")
    private String notes;

    private LocalDate paymentDate;

    public PaymentUpdateRequest() {}

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
        this.reference = reference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }
}

