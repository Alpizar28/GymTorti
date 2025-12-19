package com.mastergym.backend.client.controller;

import com.mastergym.backend.client.dto.ClientRequest;
import com.mastergym.backend.client.dto.ClientResponse;
import com.mastergym.backend.client.service.ClientService;
import com.mastergym.backend.common.error.BadRequestException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import com.mastergym.backend.client.dto.ClientUpdateRequest;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping
    public ResponseEntity<ClientResponse> createClient(@Valid @RequestBody ClientRequest request) {
        ClientResponse created = clientService.createClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public Page<ClientResponse> listClients(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 50, sort = "fechaRegistro", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (pageable.getPageSize() > 200) {
            throw new BadRequestException("size máximo permitido: 200");
        }
        return clientService.listClients(search, pageable);
    }


    @GetMapping("/{id}")
    public ClientResponse getClientById(
            @PathVariable Long id
    ) {
        return clientService.getClientById(id);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(
            @PathVariable Long id,
            @Valid @RequestBody ClientUpdateRequest request
    ) {
        return clientService.updateClient(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }


}
