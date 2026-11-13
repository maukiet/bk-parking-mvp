package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hcmut.bkparking.entity.ParkingSession;

import java.util.List;
import java.util.Optional;

public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    long countByParkingLotIdAndStatus(Long parkingLotId, String status);
    long countByStatus(String status);
    Optional<ParkingSession> findByVehicleIdAndStatus(Long vehicleId, String status);
    List<ParkingSession> findByStatusOrderByCheckinTimeDesc(String status);
    List<ParkingSession> findByParkingLotIdAndStatusOrderByCheckinTimeDesc(Long parkingLotId, String status);
    List<ParkingSession> findByVehicleUserIdOrderByCheckinTimeDesc(Long userId);
    List<ParkingSession> findAllByOrderByCheckinTimeDesc();
}

