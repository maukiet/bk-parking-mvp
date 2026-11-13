package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Tag(name = "4. Staff Gate Control, QR Scan & History (TV2 + TV1 Integration)", description = "API xác thực mã QR, ghi nhận xe VÀO/RA (check-in/check-out), tra cứu xe và lịch sử gửi xe")
public class StaffAndSessionController {

    private final VehicleRepository vehicleRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final UserPackageRepository userPackageRepository;
    private final UserRepository userRepository;

    public StaffAndSessionController(
            VehicleRepository vehicleRepository,
            ParkingLotRepository parkingLotRepository,
            ParkingSessionRepository parkingSessionRepository,
            UserPackageRepository userPackageRepository,
            UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.userPackageRepository = userPackageRepository;
        this.userRepository = userRepository;
    }

    public static class VerifyQrRequest {
        @NotBlank(message = "Mã QR hoặc biển số không được để trống")
        private String qrOrPlate;

        public String getQrOrPlate() { return qrOrPlate; }
        public void setQrOrPlate(String qrOrPlate) { this.qrOrPlate = qrOrPlate; }
    }

    public static class CheckInRequest {
        @NotBlank(message = "Mã QR hoặc biển số không được để trống")
        private String qrOrPlate;
        @NotNull(message = "Vui lòng chọn bãi đỗ xe (parkingLotId)")
        private Long parkingLotId;
        private String entryGate;
        private String note;

        public String getQrOrPlate() { return qrOrPlate; }
        public void setQrOrPlate(String qrOrPlate) { this.qrOrPlate = qrOrPlate; }
        public Long getParkingLotId() { return parkingLotId; }
        public void setParkingLotId(Long parkingLotId) { this.parkingLotId = parkingLotId; }
        public String getEntryGate() { return entryGate; }
        public void setEntryGate(String entryGate) { this.entryGate = entryGate; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class CheckOutRequest {
        @NotBlank(message = "Mã QR hoặc biển số không được để trống")
        private String qrOrPlate;
        private String exitGate;
        private String note;

        public String getQrOrPlate() { return qrOrPlate; }
        public void setQrOrPlate(String qrOrPlate) { this.qrOrPlate = qrOrPlate; }
        public String getExitGate() { return exitGate; }
        public void setExitGate(String exitGate) { this.exitGate = exitGate; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    @PostMapping("/api/v1/staff/qr/verify")
    @Operation(summary = "[Staff] Quét / nhập mã QR hoặc biển số để kiểm tra hợp lệ trước khi cho VÀO/RA")
    public ApiResponse<Map<String, Object>> verifyQr(@Valid @RequestBody VerifyQrRequest request) {
        Vehicle vehicle = resolveVehicle(request.getQrOrPlate());
        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(vehicle.getUser().getId(), "ACTIVE");
        Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE");

        boolean isApproved = "APPROVED".equalsIgnoreCase(vehicle.getStatus());
        boolean hasPackage = !activePackages.isEmpty();
        boolean validForEntry = isApproved && hasPackage && activeSession.isEmpty();
        boolean validForExit = activeSession.isPresent();

        String recommendedAction;
        String statusMessage;
        if (!isApproved) {
            recommendedAction = "DENY";
            statusMessage = "Phương tiện chưa được duyệt (Trạng thái: " + vehicle.getStatus() + ")";
        } else if (activeSession.isPresent()) {
            recommendedAction = "CHECK_OUT";
            statusMessage = "Xe đang gửi tại " + activeSession.get().getParkingLot().getName() + " — Sẵn sàng xác nhận RA";
        } else if (!hasPackage) {
            recommendedAction = "DENY";
            statusMessage = "Tài khoản chưa có gói đỗ xe còn hiệu lực";
        } else {
            recommendedAction = "CHECK_IN";
            statusMessage = "Phương tiện và gói đỗ xe hợp lệ — Sẵn sàng xác nhận VÀO bãi";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("valid", isApproved && (hasPackage || activeSession.isPresent()));
        result.put("recommendedAction", recommendedAction);
        result.put("statusMessage", statusMessage);
        result.put("vehicleId", vehicle.getId());
        result.put("licensePlate", vehicle.getLicensePlate());
        result.put("vehicleType", vehicle.getVehicleType());
        result.put("brand", vehicle.getBrand());
        result.put("model", vehicle.getModel());
        result.put("color", vehicle.getColor());
        result.put("vehicleStatus", vehicle.getStatus());
        result.put("qrToken", vehicle.getQrToken());
        result.put("ownerName", vehicle.getUser().getFullName());
        result.put("ownerCode", vehicle.getUser().getCode());
        result.put("packageEligible", hasPackage);
        result.put("packageName", hasPackage ? activePackages.get(0).getParkingPackage().getName() : null);
        result.put("validForEntry", validForEntry);
        result.put("validForExit", validForExit);
        result.put("activeSession", activeSession.map(this::toSessionDto).orElse(null));
        return ApiResponse.ok(result);
    }

    @PostMapping("/api/v1/staff/sessions/check-in")
    @Transactional
    @Operation(summary = "[Staff] Ghi nhận xe VÀO bãi (Check-in)", description = "Kiểm tra quyền gửi xe, sức chứa bãi và chống tạo 2 lượt vào đang mở cho cùng 1 xe")
    public ApiResponse<Map<String, Object>> checkIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckInRequest request) {
        Vehicle vehicle = resolveVehicle(request.getQrOrPlate());

        if (!"APPROVED".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BusinessException(ErrorCode.VEHICLE_NOT_APPROVED,
                    "Phương tiện " + vehicle.getLicensePlate() + " chưa được duyệt (" + vehicle.getStatus() + ")");
        }

        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(vehicle.getUser().getId(), "ACTIVE");
        if (activePackages.isEmpty()) {
            throw new BusinessException(ErrorCode.PACKAGE_INELIGIBLE,
                    "Chủ xe " + vehicle.getUser().getFullName() + " chưa có gói đỗ xe còn hiệu lực");
        }

        Optional<ParkingSession> existingActive = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE");
        if (existingActive.isPresent()) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_ACTIVE,
                    "Xe " + vehicle.getLicensePlate() + " hiện đang ở trong bãi ("
                            + existingActive.get().getParkingLot().getName() + "), không thể tạo lượt VÀO trùng");
        }

        ParkingLot lot = parkingLotRepository.findById(request.getParkingLotId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bãi đỗ ID: " + request.getParkingLotId()));

        if (!"OPEN".equalsIgnoreCase(lot.getStatus())) {
            throw new BusinessException(ErrorCode.PARKING_LOT_FULL, "Bãi đỗ " + lot.getName() + " hiện không mở cửa (" + lot.getStatus() + ")");
        }

        long occupiedCount = parkingSessionRepository.countByParkingLotIdAndStatus(lot.getId(), "ACTIVE");
        if (occupiedCount >= lot.getCapacity()) {
            throw new BusinessException(ErrorCode.PARKING_LOT_FULL, "Bãi đỗ " + lot.getName() + " đã đầy (" + occupiedCount + "/" + lot.getCapacity() + ")");
        }

        User staff = userRepository.findById(principal.getId()).orElse(null);

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setParkingLot(lot);
        session.setCheckinStaff(staff);
        session.setEntryGate(request.getEntryGate() != null && !request.getEntryGate().isBlank() ? request.getEntryGate().trim() : "Cổng chính");
        session.setCheckinTime(LocalDateTime.now());
        session.setStatus("ACTIVE");
        session.setNote(request.getNote());

        ParkingSession saved = parkingSessionRepository.save(session);
        return ApiResponse.ok("Xác nhận cho xe VÀO bãi thành công", toSessionDto(saved));
    }

    @PostMapping("/api/v1/staff/sessions/check-out")
    @Transactional
    @Operation(summary = "[Staff] Ghi nhận xe RA khỏi bãi (Check-out)", description = "Đóng ParkingSession đang mở của xe và giải phóng chỗ trống cho bãi")
    public ApiResponse<Map<String, Object>> checkOut(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckOutRequest request) {
        Vehicle vehicle = resolveVehicle(request.getQrOrPlate());

        ParkingSession activeSession = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE")
                .orElseThrow(() -> new BusinessException(ErrorCode.NO_ACTIVE_SESSION,
                        "Xe " + vehicle.getLicensePlate() + " hiện không có lượt gửi đang mở trong bãi để cho RA"));

        User staff = userRepository.findById(principal.getId()).orElse(null);

        activeSession.setCheckoutStaff(staff);
        activeSession.setExitGate(request.getExitGate() != null && !request.getExitGate().isBlank() ? request.getExitGate().trim() : "Cổng ra chính");
        activeSession.setCheckoutTime(LocalDateTime.now());
        activeSession.setStatus("COMPLETED");
        if (request.getNote() != null && !request.getNote().isBlank()) {
            activeSession.setNote(request.getNote().trim());
        }

        ParkingSession saved = parkingSessionRepository.save(activeSession);
        return ApiResponse.ok("Xác nhận cho xe RA khỏi bãi thành công", toSessionDto(saved));
    }

    @GetMapping("/api/v1/staff/vehicles/search")
    @Operation(summary = "[Staff] Tra cứu phương tiện theo biển số / MSSV / họ tên / mã QR")
    public ApiResponse<List<Map<String, Object>>> searchVehicles(@RequestParam(defaultValue = "") String keyword) {
        List<Vehicle> vehicles = keyword.isBlank()
                ? vehicleRepository.findAll()
                : vehicleRepository.searchVehicles(keyword.trim());

        List<Map<String, Object>> list = vehicles.stream().map(v -> {
            Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(v.getId(), "ACTIVE");
            List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(v.getUser().getId(), "ACTIVE");
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("vehicleId", v.getId());
            m.put("licensePlate", v.getLicensePlate());
            m.put("vehicleType", v.getVehicleType());
            m.put("brand", v.getBrand());
            m.put("model", v.getModel());
            m.put("color", v.getColor());
            m.put("status", v.getStatus());
            m.put("qrToken", v.getQrToken());
            m.put("ownerName", v.getUser().getFullName());
            m.put("ownerCode", v.getUser().getCode());
            m.put("ownerPhone", v.getUser().getPhone());
            m.put("packageEligible", !activePackages.isEmpty());
            m.put("currentlyParked", activeSession.isPresent());
            m.put("activeSession", activeSession.map(this::toSessionDto).orElse(null));
            return m;
        }).collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    @GetMapping("/api/v1/staff/sessions/active")
    @Operation(summary = "[Staff] Danh sách xe hiện đang gửi trong bãi")
    public ApiResponse<List<Map<String, Object>>> getActiveSessions(@RequestParam(required = false) Long parkingLotId) {
        List<ParkingSession> sessions = parkingLotId != null
                ? parkingSessionRepository.findByParkingLotIdAndStatusOrderByCheckinTimeDesc(parkingLotId, "ACTIVE")
                : parkingSessionRepository.findByStatusOrderByCheckinTimeDesc("ACTIVE");
        return ApiResponse.ok(sessions.stream().map(this::toSessionDto).collect(Collectors.toList()));
    }

    @GetMapping("/api/v1/staff/sessions/history")
    @Operation(summary = "[Staff] Lịch sử toàn bộ lượt xe ra/vào bãi")
    public ApiResponse<List<Map<String, Object>>> getAllSessionHistory() {
        List<ParkingSession> sessions = parkingSessionRepository.findAllByOrderByCheckinTimeDesc();
        return ApiResponse.ok(sessions.stream().map(this::toSessionDto).collect(Collectors.toList()));
    }

    @GetMapping("/api/v1/sessions/my-history")
    @Operation(summary = "[User] Lịch sử gửi xe ra/vào của tôi")
    public ApiResponse<List<Map<String, Object>>> getMySessionHistory(@AuthenticationPrincipal UserPrincipal principal) {
        List<ParkingSession> sessions = parkingSessionRepository.findByVehicleUserIdOrderByCheckinTimeDesc(principal.getId());
        return ApiResponse.ok(sessions.stream().map(this::toSessionDto).collect(Collectors.toList()));
    }

    private Vehicle resolveVehicle(String qrOrPlate) {
        String input = qrOrPlate.trim();
        return vehicleRepository.findByQrToken(input)
                .or(() -> vehicleRepository.findByLicensePlateIgnoreCase(input))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_QR_TOKEN,
                        "Không tìm thấy phương tiện khớp với mã QR hoặc biển số: " + input));
    }

    private Map<String, Object> toSessionDto(ParkingSession s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sessionId", s.getId());
        m.put("vehicleId", s.getVehicle().getId());
        m.put("licensePlate", s.getVehicle().getLicensePlate());
        m.put("vehicleType", s.getVehicle().getVehicleType());
        m.put("ownerName", s.getVehicle().getUser().getFullName());
        m.put("ownerCode", s.getVehicle().getUser().getCode());
        m.put("parkingLotId", s.getParkingLot().getId());
        m.put("parkingLotCode", s.getParkingLot().getCode());
        m.put("parkingLotName", s.getParkingLot().getName());
        m.put("entryGate", s.getEntryGate());
        m.put("exitGate", s.getExitGate());
        m.put("checkinTime", s.getCheckinTime() != null ? s.getCheckinTime().toString() : null);
        m.put("checkoutTime", s.getCheckoutTime() != null ? s.getCheckoutTime().toString() : null);
        m.put("status", s.getStatus());
        m.put("note", s.getNote());
        return m;
    }
}

