package com.mastergym.backend.client.repository;

import com.mastergym.backend.client.model.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface ClientRepository extends JpaRepository<ClientEntity, Long>, JpaSpecificationExecutor<ClientEntity> {

    List<ClientEntity> findByGymId(Long gymId);

    List<ClientEntity> findByGymIdAndNombreContainingIgnoreCase(Long gymId, String nombre);

    Optional<ClientEntity> findByIdAndGymId(Long id, Long gymId);

    List<ClientEntity> findByFechaVencimiento(LocalDate fechaVencimiento);

}
