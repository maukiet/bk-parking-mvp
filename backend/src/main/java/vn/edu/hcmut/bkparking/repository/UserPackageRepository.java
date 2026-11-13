package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hcmut.bkparking.entity.UserPackage;
import java.util.List;

public interface UserPackageRepository extends JpaRepository<UserPackage, Long> {
    List<UserPackage> findByUserIdOrderByEndDateDesc(Long userId);
    List<UserPackage> findByUserIdAndStatus(Long userId, String status);
}

