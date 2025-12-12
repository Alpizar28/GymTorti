package com.mastergym.backend.client.service;

import com.mastergym.backend.client.dto.ClientRequest;
import com.mastergym.backend.client.dto.ClientResponse;
import com.mastergym.backend.client.model.ClientEntity;
import com.mastergym.backend.client.repository.ClientRepository;
import org.springframework.stereotype.Service;
import com.mastergym.backend.client.dto.ClientUpdateRequest;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public ClientResponse createClient(ClientRequest request) {
        ClientEntity entity = new ClientEntity(
                request.getGymId(),
                request.getNombre(),
                request.getApellido(),
                request.getTelefono(),
                request.getEmail(),
                request.getNotas()
        );

        ClientEntity saved = clientRepository.save(entity);
        return toResponse(saved);
    }

    public List<ClientResponse> listClients(Long gymId, String search) {
        List<ClientEntity> entities;

        if (search != null && !search.isBlank()) {
            entities = clientRepository.search(gymId, search);
        } else {
            entities = clientRepository.findByGymId(gymId);
        }

        return entities.stream().map(this::toResponse).toList();
    }


    public ClientResponse getClientById(Long gymId, Long id) {
    ClientEntity entity = clientRepository.findByIdAndGymId(id, gymId)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    return toResponse(entity);
    }

    public ClientResponse updateClient(Long gymId, Long id, ClientUpdateRequest request) {
        ClientEntity entity = clientRepository.findByIdAndGymId(id, gymId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (request.getNombre() != null) entity.setNombre(request.getNombre());
        if (request.getApellido() != null) entity.setApellido(request.getApellido());
        if (request.getTelefono() != null) entity.setTelefono(request.getTelefono());
        if (request.getEmail() != null) entity.setEmail(request.getEmail());
        if (request.getNotas() != null) entity.setNotas(request.getNotas());
        if (request.getEstado() != null) entity.setEstado(request.getEstado());

        ClientEntity saved = clientRepository.save(entity);
        return toResponse(saved);
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
                e.getNotas()
        );
    }
}
