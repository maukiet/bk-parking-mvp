package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmut.bkparking.common.dto.ApiResponse;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.entity.*;
import vn.edu.hcmut.bkparking.repository.*;
import vn.edu.hcmut.bkparking.security.UserPrincipal;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@Tag(name = "3. Vehicles, Approval & Packages (TV2 + TV1 Integration)", description = "API đăng ký phương tiện, lấy mã QR, xem gói mẫu và Admin duyệt/từ chối phương tiện")
public class VehicleAndPackageController {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ParkingPackageRepository parkingPackageRepository;
    private final UserPackageRepository userPackageRepository;
    private final ParkingSessionRepository parkingSessionRepository;

    @Value("${app.vehicle.max-per-user:2}")
    private int maxVehiclesPerUser;

    public VehicleAndPackageController(
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            ParkingPackageRepository parkingPackageRepository,
            UserPackageRepository userPackageRepository,
            ParkingSessionRepository parkingSessionRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.parkingPackageRepository = parkingPackageRepository;
        this.userPackageRepository = userPackageRepository;
        this.parkingSessionRepository = parkingSessionRepository;
    }

    public static class CreateVehicleRequest {
        @NotBlank(message = "Biển số xe không được để trống")
        private String licensePlate;
        @NotBlank(message = "Loại phương tiện không được để trống (MOTORBIKE, BICYCLE, ELECTRIC_BIKE)")
        private String vehicleType;
        private String brand;
        private String model;
        private String color;
        private String registrationDocUrl;

        public String getLicensePlate() { return licensePlate; }
        public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
        public String getVehicleType() { return vehicleType; }
        public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public String getRegistrationDocUrl() { return registrationDocUrl; }
        public void setRegistrationDocUrl(String registrationDocUrl) { this.registrationDocUrl = registrationDocUrl; }
    }

    public static class RejectVehicleRequest {
        @NotBlank(message = "Vui lòng nhập lý do từ chối")
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    @GetMapping("/api/v1/packages")
    @Operation(summary = "[User] Xem danh sách gói đỗ xe mẫu và gói hiện tại của người dùng")
    public ApiResponse<Map<String, Object>> getPackages(@AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> availablePackages = parkingPackageRepository.findByIsActiveTrue().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("code", p.getCode());
            m.put("name", p.getName());
            m.put("description", p.getDescription());
            m.put("vehicleType", p.getVehicleType());
            m.put("price", p.getPrice());
            m.put("durationDays", p.getDurationDays());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> myPackages = userPackageRepository.findByUserIdOrderByEndDateDesc(principal.getId()).stream().map(up -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", up.getId());
            m.put("packageCode", up.getParkingPackage().getCode());
            m.put("packageName", up.getParkingPackage().getName());
            m.put("vehicleType", up.getParkingPackage().getVehicleType());
            m.put("price", up.getParkingPackage().getPrice());
            m.put("startDate", up.getStartDate().toString());
            m.put("endDate", up.getEndDate().toString());
            m.put("status", up.getStatus());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("availablePackages", availablePackages);
        result.put("mySubscriptions", myPackages);
        return ApiResponse.ok(result);
    }

    @GetMapping("/api/v1/vehicles/my")
    @Operation(summary = "[User] Xem danh sách phương tiện của tôi")
    public ApiResponse<List<Map<String, Object>>> getMyVehicles(@AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> list = vehicleRepository.findByUserIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(this::toVehicleDto)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    @PostMapping("/api/v1/vehicles")
    @Transactional
    @Operation(summary = "[User] Đăng ký phương tiện mới", description = "Trạng thái ban đầu là PENDING. Kiểm tra trùng biển số và giới hạn tối đa 2 xe hợp lệ/người dùng.")
    public ApiResponse<Map<String, Object>> registerVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateVehicleRequest request) {
        String normalizedPlate = request.getLicensePlate().trim().toUpperCase();

        if (vehicleRepository.findByLicensePlateIgnoreCase(normalizedPlate).isPresent()) {
            throw new BusinessException(ErrorCode.DUPLICATE_LICENSE_PLATE,
                    "Biển số xe " + normalizedPlate + " đã được đăng ký trong hệ thống");
        }

        long activeOrPendingCount = vehicleRepository.countByUserIdAndStatusIn(
                principal.getId(), List.of("PENDING", "APPROVED"));
        if (activeOrPendingCount >= maxVehiclesPerUser) {
            throw new BusinessException(ErrorCode.VEHICLE_LIMIT_EXCEEDED,
                    "Mỗi tài khoản chỉ được đăng ký tối đa " + maxVehiclesPerUser + " phương tiện (đang chờ duyệt hoặc đã duyệt)");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setLicensePlate(normalizedPlate);
        vehicle.setVehicleType(request.getVehicleType().trim().toUpperCase());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setColor(request.getColor());
        vehicle.setRegistrationDocUrl(request.getRegistrationDocUrl());
        vehicle.setStatus("PENDING");
        vehicle.setCreatedAt(LocalDateTime.now());
        vehicle.setUpdatedAt(LocalDateTime.now());

        Vehicle saved = vehicleRepository.save(vehicle);
        return ApiResponse.ok("Gửi yêu cầu đăng ký phương tiện thành công (Trạng thái: Chờ duyệt)", toVehicleDto(saved));
    }

    @GetMapping("/api/v1/vehicles/{id}/qr")
    @Operation(summary = "[User] Mở mã QR gắn với phương tiện đã được duyệt")
    public ApiResponse<Map<String, Object>> getVehicleQr(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phương tiện ID: " + id));

        boolean isOwner = vehicle.getUser().getId().equals(principal.getId());
        boolean isAdminOrStaff = !"ROLE_USER".equals(principal.getRoleCode());
        if (!isOwner && !isAdminOrStaff) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (!"APPROVED".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BusinessException(ErrorCode.VEHICLE_NOT_APPROVED,
                    "Phương tiện chưa được duyệt (trạng thái hiện tại: " + vehicle.getStatus() + ") nên chưa thể sử dụng mã QR");
        }

        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(vehicle.getUser().getId(), "ACTIVE");
        Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE");

        Map<String, Object> qrData = new LinkedHashMap<>();
        qrData.put("vehicleId", vehicle.getId());
        qrData.put("licensePlate", vehicle.getLicensePlate());
        qrData.put("vehicleType", vehicle.getVehicleType());
        qrData.put("ownerName", vehicle.getUser().getFullName());
        qrData.put("ownerCode", vehicle.getUser().getCode());
        qrData.put("qrToken", vehicle.getQrToken());
        qrData.put("packageEligible", !activePackages.isEmpty());
        qrData.put("currentlyInParkingLot", activeSession.isPresent());
        qrData.put("currentParkingLot", activeSession.map(s -> s.getParkingLot().getName()).orElse(null));
        return ApiResponse.ok(qrData);
    }

    @GetMapping("/api/v1/admin/vehicles")
    @Operation(summary = "[Admin] Danh sách phương tiện (lọc theo status=PENDING / APPROVED / REJECTED)")
    public ApiResponse<List<Map<String, Object>>> getAdminVehicles(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        List<Vehicle> vehicles;
        if (keyword != null && !keyword.isBlank()) {
            vehicles = vehicleRepository.searchVehicles(keyword.trim());
            if (status != null && !status.isBlank()) {
                String st = status.trim().toUpperCase();
                vehicles = vehicles.stream()
                        .filter(v -> st.equalsIgnoreCase(v.getStatus()))
                        .collect(Collectors.toList());
            }
        } else if (status != null && !status.isBlank()) {
            vehicles = vehicleRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        } else {
            vehicles = vehicleRepository.findAll();
        }
        return ApiResponse.ok(vehicles.stream().map(this::toVehicleDto).collect(Collectors.toList()));
    }

    @GetMapping("/api/v1/admin/vehicles/{id}")
    @Operation(summary = "[Admin] Xem chi tiết hồ sơ phương tiện")
    public ApiResponse<Map<String, Object>> getAdminVehicleDetail(@PathVariable Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phương tiện ID: " + id));
        return ApiResponse.ok(toVehicleDto(vehicle));
    }

    @PatchMapping("/api/v1/admin/vehicles/{id}/approve")
    @Transactional
    @Operation(summary = "[Admin] Duyệt đăng ký phương tiện", description = "Chuyển trạng thái sang APPROVED và tự động phát hành mã định danh qrToken")
    public ApiResponse<Map<String, Object>> approveVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phương tiện ID: " + id));
        User reviewer = userRepository.findById(principal.getId()).orElse(null);

        String cleanPlate = vehicle.getLicensePlate().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        String qrToken = "BKQR-VEH" + vehicle.getId() + "-" + cleanPlate + "-2026";

        vehicle.setStatus("APPROVED");
        vehicle.setRejectionReason(null);
        vehicle.setQrToken(qrToken);
        vehicle.setReviewedBy(reviewer);
        vehicle.setReviewedAt(LocalDateTime.now());
        vehicle.setUpdatedAt(LocalDateTime.now());

        Vehicle saved = vehicleRepository.save(vehicle);
        return ApiResponse.ok("Đã duyệt phương tiện và cấp mã QR thành công", toVehicleDto(saved));
    }

    @PatchMapping("/api/v1/admin/vehicles/{id}/reject")
    @Transactional
    @Operation(summary = "[Admin] Từ chối đăng ký phương tiện", description = "Chuyển trạng thái sang REJECTED và lưu lý do từ chối")
    public ApiResponse<Map<String, Object>> rejectVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RejectVehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phương tiện ID: " + id));
        User reviewer = userRepository.findById(principal.getId()).orElse(null);

        vehicle.setStatus("REJECTED");
        vehicle.setRejectionReason(request.getReason().trim());
        vehicle.setQrToken(null);
        vehicle.setReviewedBy(reviewer);
        vehicle.setReviewedAt(LocalDateTime.now());
        vehicle.setUpdatedAt(LocalDateTime.now());

        Vehicle saved = vehicleRepository.save(vehicle);
        return ApiResponse.ok("Đã từ chối hồ sơ đăng ký phương tiện", toVehicleDto(saved));
    }

    private Map<String, Object> toVehicleDto(Vehicle v) {
        Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(v.getId(), "ACTIVE");
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", v.getId());
        map.put("licensePlate", v.getLicensePlate());
        map.put("vehicleType", v.getVehicleType());
        map.put("brand", v.getBrand());
        map.put("model", v.getModel());
        map.put("color", v.getColor());
        map.put("registrationDocUrl", v.getRegistrationDocUrl());
        map.put("status", v.getStatus());
        map.put("rejectionReason", v.getRejectionReason());
        map.put("qrToken", v.getQrToken());
        map.put("ownerId", v.getUser().getId());
        map.put("ownerName", v.getUser().getFullName());
        map.put("ownerCode", v.getUser().getCode());
        map.put("ownerEmail", v.getUser().getEmail());
        map.put("currentlyParked", activeSession.isPresent());
        map.put("currentParkingLotName", activeSession.map(s -> s.getParkingLot().getName()).orElse(null));
        map.put("reviewedAt", v.getReviewedAt() != null ? v.getReviewedAt().toString() : null);
        map.put("createdAt", v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);
        return map;
    }
}

