package com.mastergym.backend.client.service;

import com.mastergym.backend.client.dto.ClientRequest;
import com.mastergym.backend.client.dto.ClientResponse;
import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import com.mastergym.backend.common.enums.ClientStatus;
import com.mastergym.backend.common.audit.AuditService;
import com.mastergym.backend.common.error.BadRequestException;
import com.mastergym.backend.common.error.NotFoundException;
import com.mastergym.backend.common.gym.GymContext;
import org.springframework.stereotype.Service;
import com.mastergym.backend.client.dto.ClientUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.time.LocalDate;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final AuditService auditService;

    public ClientService(ClientRepository clientRepository, AuditService auditService) {
        this.clientRepository = clientRepository;
        this.auditService = auditService;
    }

    public ClientResponse createClient(ClientRequest request) {
        Long gymId = GymContext.requireGymId();
        ClientEntity entity = new ClientEntity(
                gymId,
                request.getNombre(),
                request.getApellido(),
                request.getTelefono(),
                request.getEmail(),
                request.getNotas()
        );

        ClientEntity saved = clientRepository.save(entity);
        auditService.log("CREATE", "client", saved.getId(), buildClientAuditDetails(saved));
        return toResponse(refreshStatus(saved));
    }

    public Page<ClientResponse> listClients(String search, Pageable pageable) {
        Long gymId = GymContext.requireGymId();
        Specification<ClientEntity> spec = specFor(gymId, search);
        return clientRepository.findAll(spec, pageable).map(entity -> toResponse(refreshStatus(entity)));
    }

    // Mantener para posibles usos internos sin paginación
    public List<ClientResponse> listClients(Long gymId, String search) {
        Specification<ClientEntity> spec = specFor(gymId, search);
        return clientRepository.findAll(spec).stream().map(entity -> toResponse(refreshStatus(entity))).toList();
    }

    public ClientResponse getClientById(Long id) {
        Long gymId = GymContext.requireGymId();
        ClientEntity entity = clientRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
        return toResponse(refreshStatus(entity));
    }

    public ClientResponse updateClient(Long id, ClientUpdateRequest request) {
        Long gymId = GymContext.requireGymId();
        ClientEntity entity = clientRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));

        if (request.getNombre() != null) {
            String nombre = request.getNombre().trim();
            if (nombre.isBlank()) throw new BadRequestException("nombre no puede ser vacío");
            entity.setNombre(nombre);
        }
        if (request.getApellido() != null) entity.setApellido(blankToNull(request.getApellido()));
        if (request.getTelefono() != null) entity.setTelefono(blankToNull(request.getTelefono()));
        if (request.getEmail() != null) entity.setEmail(blankToNull(request.getEmail()));
        if (request.getNotas() != null) entity.setNotas(blankToNull(request.getNotas()));

        ClientEntity saved = clientRepository.save(entity);
        auditService.log("UPDATE", "client", saved.getId(), buildClientAuditDetails(saved));
        return toResponse(refreshStatus(saved));
    }

    public void deleteClient(Long id) {
        Long gymId = GymContext.requireGymId();
        ClientEntity entity = clientRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new NotFoundException("Cliente no encontrado"));
        clientRepository.delete(entity);
        auditService.log("DELETE", "client", entity.getId(), buildClientAuditDetails(entity));
    }

    private static Specification<ClientEntity> specFor(Long gymId, String search) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("gymId"), gymId));

            if (search != null && !search.isBlank()) {
                String q = "%" + search.trim().toLowerCase() + "%";
                var orPredicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
                orPredicates.add(cb.like(cb.lower(root.get("nombre")), q));
                orPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("apellido"), "")), q));
                orPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("telefono"), "")), q));
                orPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("email"), "")), q));
                orPredicates.add(cb.like(cb.lower(root.get("estado").as(String.class)), q));
                predicates.add(cb.or(orPredicates.toArray(jakarta.persistence.criteria.Predicate[]::new)));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private ClientResponse toResponse(ClientEntity e) {
        return new ClientResponse(
                e.getId(),
                e.getGymId(),
                e.getNombre(),
                e.getApellido(),
                e.getTelefono(),
                e.getEmail(),
                e.getEstado(),
                e.getFechaRegistro(),
                e.getFechaInicioMembresia(),
                e.getFechaVencimiento(),
                e.getNotas()
        );
    }

    private ClientEntity refreshStatus(ClientEntity entity) {
        LocalDate vencimiento = entity.getFechaVencimiento();
        LocalDate inicio = entity.getFechaInicioMembresia();
        LocalDate today = LocalDate.now();
        ClientStatus nextStatus;
        if (vencimiento == null) {
            nextStatus = ClientStatus.INACTIVO;
        } else if (inicio != null && today.isBefore(inicio)) {
            nextStatus = ClientStatus.INACTIVO;
        } else if (vencimiento.isBefore(today)) {
            nextStatus = ClientStatus.MOROSO;
        } else {
            nextStatus = ClientStatus.ACTIVO;
        }

        if (entity.getEstado() != nextStatus) {
            entity.setEstado(nextStatus);
            return clientRepository.save(entity);
        }
        return entity;
    }

    private Map<String, Object> buildClientAuditDetails(ClientEntity client) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("nombre", client.getNombre());
        if (client.getApellido() != null) details.put("apellido", client.getApellido());
        if (client.getTelefono() != null) details.put("telefono", client.getTelefono());
        if (client.getEmail() != null) details.put("email", client.getEmail());
        details.put("estado", client.getEstado());
        return details;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
