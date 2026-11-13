package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.hcmut.bkparking.entity.Vehicle;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Vehicle> findByStatusOrderByCreatedAtDesc(String status);
    Optional<Vehicle> findByLicensePlateIgnoreCase(String licensePlate);
    Optional<Vehicle> findByQrToken(String qrToken);
    long countByUserIdAndStatusIn(Long userId, List<String> statuses);
    long countByStatus(String status);

    @Query("SELECT v FROM Vehicle v WHERE LOWER(v.licensePlate) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(v.user.code) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(v.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(COALESCE(v.qrToken, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Vehicle> searchVehicles(@Param("keyword") String keyword);
}

