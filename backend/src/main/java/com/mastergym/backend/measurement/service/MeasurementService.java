package com.mastergym.backend.measurement.service;

import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.common.audit.AuditService;
import com.mastergym.backend.common.error.NotFoundException;
import com.mastergym.backend.common.gym.GymContext;
import com.mastergym.backend.measurement.dto.MeasurementRequest;
import com.mastergym.backend.measurement.dto.MeasurementResponse;
import com.mastergym.backend.measurement.model.MeasurementEntity;
import com.mastergym.backend.measurement.repository.MeasurementRepository;
import com.mastergym.backend.measurement.report.MeasurementDetailReportHtmlBuilder;
import com.mastergym.backend.measurement.report.MeasurementReportHtmlBuilder;
import com.mastergym.backend.measurement.report.MeasurementReportPdfRenderer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@Service
public class MeasurementService {

    private final MeasurementRepository measurementRepository;
    private final ClientRepository clientRepository;
    private final AuditService auditService;

    public MeasurementService(MeasurementRepository measurementRepository, ClientRepository clientRepository, AuditService auditService) {
        this.measurementRepository = measurementRepository;
        this.clientRepository = clientRepository;
        this.auditService = auditService;
    }

    public MeasurementResponse create(MeasurementRequest request) {
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(request.getClientId(), gymId)
                .orElseThrow(() -> new BadRequestException("clientId invalido (no pertenece al gym)"));

        MeasurementEntity entity = new MeasurementEntity(
                gymId,
                client,
                request.getFecha(),
                request.getPeso(),
                request.getAltura(),
                request.getPechoCm(),
                request.getCinturaCm(),
                request.getCaderaCm(),
                request.getBrazoIzqCm(),
                request.getBrazoDerCm(),
                request.getPiernaIzqCm(),
                request.getPiernaDerCm(),
                request.getGrasaCorporal(),
                blankToNull(request.getNotas())
        );

        MeasurementEntity saved = measurementRepository.save(entity);
        auditService.log("CREATE", "measurement", saved.getId(), buildMeasurementAuditDetails(saved));
        return toResponse(saved);
    }

    public Page<MeasurementResponse> list(Long clientId, Pageable pageable) {
        Long gymId = GymContext.requireGymId();
        Specification<MeasurementEntity> spec = specFor(gymId, clientId);
        return measurementRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public MeasurementResponse getById(Long id) {
        Long gymId = GymContext.requireGymId();
        MeasurementEntity entity = measurementRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Medicion no encontrada"));
        return toResponse(entity);
    }

    public byte[] buildReportPdf(Long clientId) {
        if (clientId == null) {
            throw new BadRequestException("clientId requerido");
        }
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(clientId, gymId)
                .orElseThrow(() -> new BadRequestException("clientId invalido (no pertenece al gym)"));
        Specification<MeasurementEntity> spec = specFor(gymId, clientId);
        List<MeasurementEntity> measurements = measurementRepository.findAll(
                spec,
                Sort.by(Sort.Direction.DESC, "fecha")
        );
        measurements = limitToLastFive(measurements);
        String html = MeasurementReportHtmlBuilder.build(client, measurements);
        return MeasurementReportPdfRenderer.render(html);
    }

    public ReportPdfPayload buildReportPdfPayload(Long clientId) {
        if (clientId == null) {
            throw new BadRequestException("clientId requerido");
        }
        Long gymId = GymContext.requireGymId();
        ClientEntity client = clientRepository.findByIdAndGymId(clientId, gymId)
                .orElseThrow(() -> new BadRequestException("clientId invalido (no pertenece al gym)"));
        Specification<MeasurementEntity> spec = specFor(gymId, clientId);
        List<MeasurementEntity> measurements = measurementRepository.findAll(
                spec,
                Sort.by(Sort.Direction.DESC, "fecha")
        );
        measurements = limitToLastFive(measurements);
        String html = MeasurementReportHtmlBuilder.build(client, measurements);
        byte[] pdf = MeasurementReportPdfRenderer.render(html);
        String filename = buildClientFilename(client);
        return new ReportPdfPayload(pdf, filename);
    }

    public byte[] buildDetailReportPdf(Long measurementId) {
        if (measurementId == null) {
            throw new BadRequestException("measurementId requerido");
        }
        Long gymId = GymContext.requireGymId();
        MeasurementEntity measurement = measurementRepository.findByIdAndGymId(measurementId, gymId)
                .orElseThrow(() -> new NotFoundException("Medicion no encontrada"));
        ClientEntity client = measurement.getClient();
        String html = MeasurementDetailReportHtmlBuilder.build(client, measurement);
        return MeasurementReportPdfRenderer.render(html);
    }

    public record ReportPdfPayload(byte[] pdf, String filename) {}

    public void delete(Long id) {
        Long gymId = GymContext.requireGymId();
        MeasurementEntity entity = measurementRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Medicion no encontrada"));
        measurementRepository.delete(entity);
        auditService.log("DELETE", "measurement", entity.getId(), buildMeasurementAuditDetails(entity));
    }

    private MeasurementResponse toResponse(MeasurementEntity e) {
        return new MeasurementResponse(
                e.getId(),
                e.getGymId(),
                e.getClient().getId(),
                e.getFecha(),
                e.getPeso(),
                e.getAltura(),
                e.getPechoCm(),
                e.getCinturaCm(),
                e.getCaderaCm(),
                e.getBrazoIzqCm(),
                e.getBrazoDerCm(),
                e.getPiernaIzqCm(),
                e.getPiernaDerCm(),
                e.getGrasaCorporal(),
                e.getNotas(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private static Specification<MeasurementEntity> specFor(Long gymId, Long clientId) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("gymId"), gymId));

            if (clientId != null) {
                predicates.add(cb.equal(root.get("client").get("id"), clientId));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Map<String, Object> buildMeasurementAuditDetails(MeasurementEntity measurement) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("clientId", measurement.getClient().getId());
        details.put("fecha", measurement.getFecha());
        details.put("peso", measurement.getPeso());
        return details;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String buildClientFilename(ClientEntity client) {
        String nombre = client.getNombre() == null ? "" : client.getNombre();
        String apellido = client.getApellido() == null ? "" : client.getApellido();
        String fullName = (nombre + " " + apellido).trim();
        String normalized = Normalizer.normalize(fullName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String slug = normalized.replaceAll("[^A-Za-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (slug.isBlank()) {
            slug = "cliente";
        }
        return "mediciones_" + slug + ".pdf";
    }

    private static List<MeasurementEntity> limitToLastFive(List<MeasurementEntity> measurements) {
        if (measurements.size() <= 5) {
            return measurements;
        }
        return measurements.subList(0, 5);
    }
}
