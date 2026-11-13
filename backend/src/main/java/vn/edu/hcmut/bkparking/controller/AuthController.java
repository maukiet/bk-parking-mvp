package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmut.bkparking.common.dto.ApiResponse;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.entity.User;
import vn.edu.hcmut.bkparking.entity.UserPackage;
import vn.edu.hcmut.bkparking.repository.UserPackageRepository;
import vn.edu.hcmut.bkparking.repository.UserRepository;
import vn.edu.hcmut.bkparking.repository.VehicleRepository;
import vn.edu.hcmut.bkparking.security.JwtTokenProvider;
import vn.edu.hcmut.bkparking.security.UserPrincipal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "1. Auth & Portal Selection (TV1)", description = "Đăng nhập demo, lấy thông tin phiên làm việc và danh sách tài khoản demo")
public class AuthController {

    private final UserRepository userRepository;
    private final UserPackageRepository userPackageRepository;
    private final VehicleRepository vehicleRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(
            UserRepository userRepository,
            UserPackageRepository userPackageRepository,
            VehicleRepository vehicleRepository,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.userPackageRepository = userPackageRepository;
        this.vehicleRepository = vehicleRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public static class LoginRequest {
        @NotBlank(message = "Tên đăng nhập không được để trống")
        private String username;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập Demo (User / Admin / Staff)", description = "Trả về JWT accessToken và portal đích dựa theo vai trò")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        String cleanPass = user.getPasswordHash().replace("{noop}", "");
        if (!cleanPass.equals(request.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Tài khoản đã bị khóa");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accessToken", token);
        result.put("tokenType", "Bearer");
        result.put("portalTarget", resolvePortalTarget(user.getRole().getCode()));
        result.put("user", buildUserInfo(user));

        return ApiResponse.ok("Đăng nhập thành công", result);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản đang đăng nhập", description = "Dùng khi khởi tạo hoặc reload trang trên Frontend")
    public ApiResponse<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        return ApiResponse.ok(buildUserInfo(user));
    }

    @GetMapping("/demo-accounts")
    @Operation(summary = "Danh sách tài khoản Demo cho màn hình Đăng nhập", description = "Hỗ trợ FE hiển thị danh sách chọn nhanh tài khoản demo theo 3 role")
    public ApiResponse<List<Map<String, Object>>> getDemoAccounts() {
        List<Map<String, Object>> accounts = userRepository.findAll().stream().map(u -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("username", u.getUsername());
            item.put("passwordHint", "123456");
            item.put("fullName", u.getFullName());
            item.put("code", u.getCode());
            item.put("role", u.getRole().getCode());
            item.put("roleName", u.getRole().getName());
            item.put("portalTarget", resolvePortalTarget(u.getRole().getCode()));
            return item;
        }).collect(Collectors.toList());
        return ApiResponse.ok(accounts);
    }

    private String resolvePortalTarget(String roleCode) {
        if ("ROLE_ADMIN".equals(roleCode)) return "ADMIN_PORTAL";
        if ("ROLE_STAFF".equals(roleCode)) return "STAFF_PORTAL";
        return "USER_PORTAL";
    }

    private Map<String, Object> buildUserInfo(User user) {
        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
        long registeredVehicles = vehicleRepository.countByUserIdAndStatusIn(
                user.getId(), List.of("PENDING", "APPROVED"));

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", user.getId());
        info.put("username", user.getUsername());
        info.put("fullName", user.getFullName());
        info.put("code", user.getCode());
        info.put("email", user.getEmail());
        info.put("phone", user.getPhone());
        info.put("department", user.getDepartment());
        info.put("role", user.getRole().getCode());
        info.put("roleName", user.getRole().getName());
        info.put("status", user.getStatus());
        info.put("hasActivePackage", !activePackages.isEmpty());
        if (!activePackages.isEmpty()) {
            UserPackage up = activePackages.get(0);
            Map<String, Object> pkg = new LinkedHashMap<>();
            pkg.put("packageCode", up.getParkingPackage().getCode());
            pkg.put("packageName", up.getParkingPackage().getName());
            pkg.put("startDate", up.getStartDate().toString());
            pkg.put("endDate", up.getEndDate().toString());
            pkg.put("status", up.getStatus());
            info.put("activePackage", pkg);
        } else {
            info.put("activePackage", null);
        }
        info.put("registeredVehicleCount", registeredVehicles);
        info.put("maxVehicleLimit", 2);
        return info;
    }
}

