package com.mastergym.backend.payment.repository;

import com.mastergym.backend.payment.model.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long>, JpaSpecificationExecutor<PaymentEntity> {
    Optional<PaymentEntity> findByIdAndGymId(Long id, Long gymId);
}

