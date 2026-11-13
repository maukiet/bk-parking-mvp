package vn.edu.hcmut.bkparking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hcmut.bkparking.entity.Role;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCode(String code);
}

