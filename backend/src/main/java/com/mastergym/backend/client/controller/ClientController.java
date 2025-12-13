package com.mastergym.backend.client.controller;

import com.mastergym.backend.client.dto.ClientRequest;
import com.mastergym.backend.client.dto.ClientResponse;
import com.mastergym.backend.client.service.ClientService;
import org.springframework.web.bind.annotation.*;
import com.mastergym.backend.client.dto.ClientUpdateRequest;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "*") // para permitir llamadas desde el frontend
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping
    public ClientResponse createClient(@RequestBody ClientRequest request) {
        return clientService.createClient(request);
    }

    @GetMapping
    public List<ClientResponse> listClients(
            @RequestParam Long gymId,
            @RequestParam(required = false) String search
    ) {
        return clientService.listClients(gymId, search);
    }


    @GetMapping("/{id}")
    public ClientResponse getClientById(
            @RequestParam Long gymId,
            @PathVariable Long id
    ) {
        return clientService.getClientById(gymId, id);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(
            @RequestParam Long gymId,
            @PathVariable Long id,
            @RequestBody ClientUpdateRequest request
    ) {
        return clientService.updateClient(gymId, id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteClient(
            @RequestParam Long gymId,
            @PathVariable Long id
    ) {
        clientService.deleteClient(gymId, id);
    }


}
