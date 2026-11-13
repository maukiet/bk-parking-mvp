package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hcmut.bkparking.entity.ParkingPackage;
import java.util.List;

public interface ParkingPackageRepository extends JpaRepository<ParkingPackage, Long> {
    List<ParkingPackage> findByIsActiveTrue();
}

