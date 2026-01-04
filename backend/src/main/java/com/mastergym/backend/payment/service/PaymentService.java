package com.mastergym.backend.payment.service;

import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import com.mastergym.backend.common.enums.ClientStatus;
import com.mastergym.backend.common.audit.AuditService;
import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.common.error.NotFoundException;
import com.mastergym.backend.common.gym.GymContext;
import com.mastergym.backend.payment.dto.PaymentRequest;
import com.mastergym.backend.payment.dto.PaymentResponse;
import com.mastergym.backend.payment.dto.PaymentUpdateRequest;
import com.mastergym.backend.payment.enums.PaymentStatus;
import com.mastergym.backend.payment.enums.PaymentType;
import com.mastergym.backend.payment.model.PaymentEntity;
import com.mastergym.backend.payment.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClientRepository clientRepository;
    private final AuditService auditService;

    public PaymentService(
            PaymentRepository paymentRepository,
            ClientRepository clientRepository,
            AuditService auditService
    ) {
        this.paymentRepository = paymentRepository;
        this.clientRepository = clientRepository;
        this.auditService = auditService;
    }

    @Transactional
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
        applyMembershipRenewalIfNeeded(client, saved, request.getNotes());
        auditService.log("CREATE", "payment", saved.getId(), buildCreateAuditDetails(saved));
        return toResponse(saved);
    }

    public Page<PaymentResponse> list(
            Long clientId,
            String search,
            Integer days,
            Pageable pageable
    ) {
        Long gymId = GymContext.requireGymId();
        LocalDate fromDate = null;
        LocalDate toDate = null;
        if (days != null) {
            LocalDate today = LocalDate.now();
            fromDate = today.minusDays(days - 1L);
            toDate = today;
        }
        Specification<PaymentEntity> spec = specFor(gymId, clientId, search, fromDate, toDate);
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

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        if (request.getClientId() != null) {
            ClientEntity client = clientRepository.findByIdAndGymId(request.getClientId(), gymId)
                    .orElseThrow(() -> new BadRequestException("clientId inválido (no pertenece al gym)"));
            entity.setClient(client);
            auditDetails.put("clientId", client.getId());
        }

        if (request.getAmount() != null) {
            entity.setAmount(request.getAmount());
            auditDetails.put("amount", request.getAmount());
        }
        if (request.getCurrency() != null) {
            entity.setCurrency(request.getCurrency());
            auditDetails.put("currency", request.getCurrency());
        }
        if (request.getPaymentMethod() != null) {
            entity.setPaymentMethod(request.getPaymentMethod());
            auditDetails.put("paymentMethod", request.getPaymentMethod());
        }
        if (request.getPaymentType() != null) {
            entity.setPaymentType(request.getPaymentType());
            auditDetails.put("paymentType", request.getPaymentType());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
            auditDetails.put("status", request.getStatus());
        }

        if (request.getReference() != null) {
            entity.setReference(blankToNull(request.getReference()));
            auditDetails.put("reference", request.getReference());
        }
        if (request.getNotes() != null) {
            entity.setNotes(blankToNull(request.getNotes()));
            auditDetails.put("notes", request.getNotes());
        }
        if (request.getPaymentDate() != null) {
            entity.setPaymentDate(request.getPaymentDate());
            auditDetails.put("paymentDate", request.getPaymentDate());
        }

        PaymentEntity saved = paymentRepository.save(entity);
        if (!auditDetails.isEmpty()) {
            auditService.log("UPDATE", "payment", saved.getId(), auditDetails);
        }
        return toResponse(saved);
    }

    public void delete(Long id) {
        Long gymId = GymContext.requireGymId();
        PaymentEntity entity = paymentRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));
        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("clientId", entity.getClient().getId());
        auditDetails.put("amount", entity.getAmount());
        auditDetails.put("paymentDate", entity.getPaymentDate());
        paymentRepository.delete(entity);
        auditService.log("DELETE", "payment", entity.getId(), auditDetails);
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

    private void applyMembershipRenewalIfNeeded(ClientEntity client, PaymentEntity payment, String notes) {
        if (payment.getStatus() != PaymentStatus.PAID) return;
        Period extension = resolveMembershipExtension(payment.getPaymentType(), notes);
        if (extension == null) return;

        LocalDate today = LocalDate.now();
        LocalDate paymentDate = payment.getPaymentDate() != null ? payment.getPaymentDate() : today;
        LocalDate current = client.getFechaVencimiento();
        LocalDate base = (current != null && !current.isBefore(paymentDate)) ? current : paymentDate;
        LocalDate nuevaFecha = base.plus(extension);

        if (paymentDate.isAfter(today) || current == null || current.isBefore(paymentDate)) {
            client.setFechaInicioMembresia(paymentDate);
        }
        client.setFechaVencimiento(nuevaFecha);
        client.setEstado(resolveStatus(client, today));
        clientRepository.save(client);
    }

    private ClientStatus resolveStatus(ClientEntity client, LocalDate today) {
        LocalDate inicio = client.getFechaInicioMembresia();
        LocalDate vencimiento = client.getFechaVencimiento();
        if (vencimiento == null) return ClientStatus.INACTIVO;
        if (inicio != null && today.isBefore(inicio)) return ClientStatus.INACTIVO;
        if (vencimiento.isBefore(today)) return ClientStatus.MOROSO;
        return ClientStatus.ACTIVO;
    }

    private static final Pattern TIPO_PAGO_PATTERN = Pattern.compile("tipoPago:\\s*(\\w+)", Pattern.CASE_INSENSITIVE);

    private Period resolveMembershipExtension(PaymentType type, String notes) {
        if (type == PaymentType.DAILY_MEMBERSHIP) return Period.ofDays(1);
        if (type == PaymentType.MONTHLY_MEMBERSHIP) return Period.ofMonths(1);
        if (type == PaymentType.QUARTERLY_MEMBERSHIP) return Period.ofMonths(3);
        if (type == PaymentType.SEMESTER_MEMBERSHIP) return Period.ofMonths(6);
        if (type == PaymentType.ANNUAL_MEMBERSHIP) return Period.ofMonths(12);

        if (notes == null || notes.isBlank()) return null;
        Matcher matcher = TIPO_PAGO_PATTERN.matcher(notes);
        if (!matcher.find()) return null;

        String raw = matcher.group(1).toLowerCase(Locale.ROOT);
        return switch (raw) {
            case "diario" -> Period.ofDays(1);
            case "mensual" -> Period.ofMonths(1);
            case "trimestral" -> Period.ofMonths(3);
            case "semestral" -> Period.ofMonths(6);
            case "anual" -> Period.ofMonths(12);
            default -> null;
        };
    }

    private static Specification<PaymentEntity> specFor(Long gymId, Long clientId, String search, LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("gymId"), gymId));

            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentDate"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentDate"), toDate));
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

    private Map<String, Object> buildCreateAuditDetails(PaymentEntity payment) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("clientId", payment.getClient().getId());
        details.put("amount", payment.getAmount());
        details.put("currency", payment.getCurrency());
        details.put("paymentMethod", payment.getPaymentMethod());
        details.put("paymentType", payment.getPaymentType());
        details.put("status", payment.getStatus());
        details.put("paymentDate", payment.getPaymentDate());
        if (payment.getReference() != null) details.put("reference", payment.getReference());
        return details;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
