package com.mastergym.backend.client.repository;

import com.mastergym.backend.client.model.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<ClientEntity, Long> {

    List<ClientEntity> findByGymId(Long gymId);

    List<ClientEntity> findByGymIdAndNombreContainingIgnoreCase(Long gymId, String nombre);

    Optional<ClientEntity> findByIdAndGymId(Long id, Long gymId);

    @Query(
    value = """
        SELECT * FROM clients c
        WHERE c.gym_id = :gymId AND (
        LOWER(c.nombre)   LIKE LOWER(CONCAT('%', :q, '%')) OR
        LOWER(COALESCE(c.apellido, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
        LOWER(COALESCE(c.telefono, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
        LOWER(COALESCE(c.email, ''))    LIKE LOWER(CONCAT('%', :q, '%')) OR
        LOWER(COALESCE(c.estado::text, '')) LIKE LOWER(CONCAT('%', :q, '%'))
        )
    """,
    nativeQuery = true
    )
    List<ClientEntity> search(@Param("gymId") Long gymId, @Param("q") String q);

}
