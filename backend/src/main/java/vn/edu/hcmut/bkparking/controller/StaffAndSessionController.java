package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmut.bkparking.common.dto.ApiResponse;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.dto.CheckInRequest;
import vn.edu.hcmut.bkparking.dto.CheckOutRequest;
import vn.edu.hcmut.bkparking.dto.ParkingSessionResponseDto;
import vn.edu.hcmut.bkparking.dto.StaffVehicleSearchResultDto;
import vn.edu.hcmut.bkparking.entity.*;
import vn.edu.hcmut.bkparking.repository.*;
import vn.edu.hcmut.bkparking.security.UserPrincipal;
import vn.edu.hcmut.bkparking.service.ParkingSessionService;
import vn.edu.hcmut.bkparking.service.VehicleEligibilityPolicy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@Tag(name = "4. Staff Gate Control, QR Scan & History (TV2 + TV1 Integration)", description = "API xác thực mã QR, ghi nhận xe VÀO/RA (check-in/check-out), tra cứu xe và lịch sử gửi xe")
public class StaffAndSessionController {

    private final ParkingSessionService parkingSessionService;
    private final VehicleRepository vehicleRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final UserPackageRepository userPackageRepository;

    public StaffAndSessionController(
            ParkingSessionService parkingSessionService,
            VehicleRepository vehicleRepository,
            ParkingSessionRepository parkingSessionRepository,
            UserPackageRepository userPackageRepository) {
        this.parkingSessionService = parkingSessionService;
        this.vehicleRepository = vehicleRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.userPackageRepository = userPackageRepository;
    }

    public static class VerifyQrRequest {
        private String qrOrPlate;
        private String qrToken;

        public String getQrOrPlate() {
            if (qrOrPlate != null && !qrOrPlate.isBlank()) return qrOrPlate;
            return qrToken;
        }

        public void setQrOrPlate(String qrOrPlate) { this.qrOrPlate = qrOrPlate; }
        public String getQrToken() { return qrToken; }
        public void setQrToken(String qrToken) { this.qrToken = qrToken; }
    }

    @PostMapping("/api/v1/staff/qr/verify")
    @Operation(summary = "[Staff] Quét / nhập mã QR hoặc biển số để kiểm tra hợp lệ trước khi cho VÀO/RA")
    public ApiResponse<Map<String, Object>> verifyQr(@Valid @RequestBody VerifyQrRequest request) {
        String input = request.getQrOrPlate();
        if (input == null || input.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã QR hoặc biển số không được để trống");
        }
        Vehicle vehicle = resolveVehicle(input);
        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(vehicle.getUser().getId(), "ACTIVE");
        Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE");

        boolean isApproved = "APPROVED".equalsIgnoreCase(vehicle.getStatus());
        boolean hasPackage = VehicleEligibilityPolicy.isEligibleForParking(vehicle, activePackages);
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
        String packageName = VehicleEligibilityPolicy.isPayrollEligibleCar(vehicle)
                ? "Thu qua bảng lương"
                : !activePackages.isEmpty() ? activePackages.get(0).getParkingPackage().getName() : null;
        result.put("packageName", packageName);
        result.put("validForEntry", validForEntry);
        result.put("validForExit", validForExit);
        result.put("activeSession", activeSession.map(this::toSessionDto).orElse(null));
        return ApiResponse.ok(result);
    }

    @PostMapping("/api/v1/staff/sessions/check-in")
    @Operation(summary = "[Staff] Ghi nhận xe VÀO bãi (Check-in)", description = "Kiểm tra quyền gửi xe, sức chứa bãi và chống tạo 2 lượt vào đang mở cho cùng 1 xe")
    public ApiResponse<ParkingSessionResponseDto> checkIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckInRequest request) {
        ParkingSessionResponseDto saved = parkingSessionService.checkIn(principal.getId(), request);
        return ApiResponse.ok("Xác nhận cho xe VÀO bãi thành công", saved);
    }

    @PostMapping("/api/v1/staff/sessions/check-out")
    @Operation(summary = "[Staff] Ghi nhận xe RA khỏi bãi (Check-out)", description = "Đóng ParkingSession đang mở của xe và giải phóng chỗ trống cho bãi")
    public ApiResponse<ParkingSessionResponseDto> checkOut(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckOutRequest request) {
        ParkingSessionResponseDto saved = parkingSessionService.checkOut(principal.getId(), request);
        return ApiResponse.ok("Xác nhận cho xe RA khỏi bãi thành công", saved);
    }

    @GetMapping("/api/v1/staff/vehicles/search")
    @Operation(summary = "[Staff] Tra cứu phương tiện theo biển số / MSSV / họ tên / mã QR")
    public ApiResponse<List<StaffVehicleSearchResultDto>> searchVehicles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String query) {
        String term = keyword != null && !keyword.isBlank() ? keyword : query;
        List<StaffVehicleSearchResultDto> list = parkingSessionService.searchVehicles(term);
        return ApiResponse.ok("Kết quả tra cứu phương tiện", list);
    }

    @GetMapping("/api/v1/staff/sessions/active")
    @Operation(summary = "[Staff] Danh sách xe hiện đang gửi trong bãi")
    public ApiResponse<List<ParkingSessionResponseDto>> getActiveSessions(@RequestParam(required = false) Long parkingLotId) {
        List<ParkingSessionResponseDto> list = parkingSessionService.getActiveSessions(parkingLotId);
        return ApiResponse.ok(list);
    }

    @GetMapping("/api/v1/staff/sessions/history")
    @Operation(summary = "[Staff] Lịch sử toàn bộ lượt xe ra/vào bãi")
    public ApiResponse<List<ParkingSessionResponseDto>> getAllSessionHistory(@RequestParam(required = false) Long parkingLotId) {
        List<ParkingSessionResponseDto> list = parkingSessionService.getAllSessionHistory(parkingLotId);
        return ApiResponse.ok(list);
    }

    @GetMapping("/api/v1/sessions/my-history")
    @Operation(summary = "[User] Lịch sử gửi xe ra/vào của tôi")
    public ApiResponse<List<ParkingSessionResponseDto>> getMySessionHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long vehicleId) {
        List<ParkingSessionResponseDto> list = parkingSessionService.getMySessionHistory(principal.getId(), vehicleId);
        return ApiResponse.ok(list);
    }

    private Vehicle resolveVehicle(String qrOrPlate) {
        return parkingSessionService.resolveVehicle(qrOrPlate);
    }

    private ParkingSessionResponseDto toSessionDto(ParkingSession s) {
        return ParkingSessionResponseDto.fromEntity(s);
    }
}

