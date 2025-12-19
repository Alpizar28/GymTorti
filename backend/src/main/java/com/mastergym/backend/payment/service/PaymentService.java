package com.mastergym.backend.payment.service;

import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.common.error.NotFoundException;
import com.mastergym.backend.common.gym.GymContext;
import com.mastergym.backend.payment.dto.PaymentRequest;
import com.mastergym.backend.payment.dto.PaymentResponse;
import com.mastergym.backend.payment.dto.PaymentUpdateRequest;
import com.mastergym.backend.payment.model.PaymentEntity;
import com.mastergym.backend.payment.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClientRepository clientRepository;

    public PaymentService(PaymentRepository paymentRepository, ClientRepository clientRepository) {
        this.paymentRepository = paymentRepository;
        this.clientRepository = clientRepository;
    }

    public PaymentResponse create(PaymentRequest request) {
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(request.getClientId(), gymId)
                .orElseThrow(() -> new BadRequestException("clientId inválido (no pertenece al gym)"));

        PaymentEntity entity = new PaymentEntity(
                gymId,
                client,
                request.getAmount(),
                request.getCurrency(),
                request.getPaymentMethod(),
                request.getPaymentType(),
                request.getStatus(),
                request.getReference(),
                request.getNotes(),
                request.getPaymentDate()
        );

        PaymentEntity saved = paymentRepository.save(entity);
        return toResponse(saved);
    }

    public Page<PaymentResponse> list(
            Long clientId,
            String search,
            Pageable pageable
    ) {
        Long gymId = GymContext.requireGymId();
        Specification<PaymentEntity> spec = specFor(gymId, clientId, search);
        return paymentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public PaymentResponse getById(Long id) {
        Long gymId = GymContext.requireGymId();
        PaymentEntity entity = paymentRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));
        return toResponse(entity);
    }

    public PaymentResponse update(Long id, PaymentUpdateRequest request) {
        Long gymId = GymContext.requireGymId();
        PaymentEntity entity = paymentRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));

        if (request.getClientId() != null) {
            ClientEntity client = clientRepository.findByIdAndGymId(request.getClientId(), gymId)
                    .orElseThrow(() -> new BadRequestException("clientId inválido (no pertenece al gym)"));
            entity.setClient(client);
        }

        if (request.getAmount() != null) entity.setAmount(request.getAmount());
        if (request.getCurrency() != null) entity.setCurrency(request.getCurrency());
        if (request.getPaymentMethod() != null) entity.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentType() != null) entity.setPaymentType(request.getPaymentType());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        if (request.getReference() != null) entity.setReference(blankToNull(request.getReference()));
        if (request.getNotes() != null) entity.setNotes(blankToNull(request.getNotes()));
        if (request.getPaymentDate() != null) entity.setPaymentDate(request.getPaymentDate());

        PaymentEntity saved = paymentRepository.save(entity);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Long gymId = GymContext.requireGymId();
        PaymentEntity entity = paymentRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));
        paymentRepository.delete(entity);
    }

    private PaymentResponse toResponse(PaymentEntity e) {
        return new PaymentResponse(
                e.getId(),
                e.getGymId(),
                e.getClient().getId(),
                e.getAmount(),
                e.getCurrency(),
                e.getPaymentMethod(),
                e.getPaymentType(),
                e.getStatus(),
                e.getReference(),
                e.getNotes(),
                e.getPaymentDate(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private static Specification<PaymentEntity> specFor(Long gymId, Long clientId, String search) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("gymId"), gymId));

            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }

            if (search != null && !search.isBlank()) {
                String q = "%" + search.trim().toLowerCase() + "%";
                var orPredicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
                orPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("reference"), "")), q));
                orPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("notes"), "")), q));
                predicates.add(cb.or(orPredicates.toArray(jakarta.persistence.criteria.Predicate[]::new)));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

