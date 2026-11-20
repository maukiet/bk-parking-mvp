package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hcmut.bkparking.entity.VehicleDocument;

import java.util.Optional;

public interface VehicleDocumentRepository extends JpaRepository<VehicleDocument, Long> {
    Optional<VehicleDocument> findByIdAndOwnerId(Long id, Long ownerId);
}
