package com.mastergym.backend.payment.controller;

import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.payment.dto.PaymentRequest;
import com.mastergym.backend.payment.dto.PaymentResponse;
import com.mastergym.backend.payment.dto.PaymentUpdateRequest;
import com.mastergym.backend.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> create(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse created = paymentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public Page<PaymentResponse> list(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer days,
            @PageableDefault(size = 50, sort = "paymentDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (days != null && (days < 1 || days > 365)) {
            throw new BadRequestException("days debe estar entre 1 y 365");
        }
        if (pageable.getPageSize() > 200) {
            throw new BadRequestException("size máximo permitido: 200");
        }
        return paymentService.list(clientId, search, days, pageable);
    }

    @GetMapping("/{id}")
    public PaymentResponse getById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PutMapping("/{id}")
    public PaymentResponse update(@PathVariable Long id, @Valid @RequestBody PaymentUpdateRequest request) {
        return paymentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        paymentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

