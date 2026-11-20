package vn.edu.hcmut.bkparking.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.dto.CheckInRequest;
import vn.edu.hcmut.bkparking.dto.CheckOutRequest;
import vn.edu.hcmut.bkparking.dto.ParkingSessionResponseDto;
import vn.edu.hcmut.bkparking.dto.StaffVehicleSearchResultDto;
import vn.edu.hcmut.bkparking.entity.*;
import vn.edu.hcmut.bkparking.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ParkingSessionService {

    private final ParkingSessionRepository parkingSessionRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final VehicleRepository vehicleRepository;
    private final UserPackageRepository userPackageRepository;
    private final UserRepository userRepository;

    public ParkingSessionService(
            ParkingSessionRepository parkingSessionRepository,
            ParkingLotRepository parkingLotRepository,
            VehicleRepository vehicleRepository,
            UserPackageRepository userPackageRepository,
            UserRepository userRepository) {
        this.parkingSessionRepository = parkingSessionRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.vehicleRepository = vehicleRepository;
        this.userPackageRepository = userPackageRepository;
        this.userRepository = userRepository;
    }

    /**
     * [Staff] Ghi nhận xe VÀO bãi (Check-in)
     * Thao tác trong 1 Transaction, kiểm tra quyền gửi xe, sức chứa bãi và chống tạo 2 lượt vào trùng lặp
     */
    public ParkingSessionResponseDto checkIn(Long staffId, CheckInRequest request) {
        String input = request.getQrOrPlate();
        if (input == null || input.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã QR hoặc biển số không được để trống");
        }
        Vehicle vehicle = resolveVehicle(input);

        // 1. Kiểm tra phương tiện đã được duyệt
        if (!"APPROVED".equalsIgnoreCase(vehicle.getStatus())) {
            throw new BusinessException(ErrorCode.VEHICLE_NOT_APPROVED,
                    "Phương tiện " + vehicle.getLicensePlate() + " chưa được duyệt (" + vehicle.getStatus() + ")");
        }

        // 2. Kiểm tra gói đỗ xe còn hiệu lực
        List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(vehicle.getUser().getId(), "ACTIVE");
        if (!VehicleEligibilityPolicy.isEligibleForParking(vehicle, activePackages)) {
            throw new BusinessException(ErrorCode.PACKAGE_INELIGIBLE,
                    "Chủ xe " + vehicle.getUser().getFullName() + " chưa có gói đỗ xe còn hiệu lực");
        }

        // 3. Chống tạo hai session ACTIVE cho cùng xe (Anti-Passback)
        Optional<ParkingSession> existingActive = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE");
        if (existingActive.isPresent()) {
            throw new BusinessException(ErrorCode.SESSION_ALREADY_ACTIVE,
                    "Xe " + vehicle.getLicensePlate() + " hiện đang ở trong bãi ("
                            + existingActive.get().getParkingLot().getName() + "), không thể tạo lượt VÀO trùng");
        }

        // 4. Kiểm tra bãi đỗ xe tồn tại và trạng thái mở cửa
        ParkingLot lot = parkingLotRepository.findById(request.getParkingLotId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bãi đỗ ID: " + request.getParkingLotId()));

        if (!"OPEN".equalsIgnoreCase(lot.getStatus())) {
            throw new BusinessException(ErrorCode.PARKING_LOT_FULL, "Bãi đỗ " + lot.getName() + " hiện không mở cửa (" + lot.getStatus() + ")");
        }

        boolean lotAcceptsVehicleType = lot.getAllowedVehicleTypes() != null
                && java.util.Arrays.stream(lot.getAllowedVehicleTypes().split(","))
                        .map(String::trim)
                        .anyMatch(type -> type.equalsIgnoreCase(vehicle.getVehicleType()));
        if (!lotAcceptsVehicleType) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Bãi " + lot.getName() + " không nhận loại phương tiện " + vehicle.getVehicleType());
        }

        // 5. Kiểm tra sức chứa bãi xe
        long occupiedCount = parkingSessionRepository.countByParkingLotIdAndStatus(lot.getId(), "ACTIVE");
        if (occupiedCount >= lot.getCapacity()) {
            throw new BusinessException(ErrorCode.PARKING_LOT_FULL, "Bãi đỗ " + lot.getName() + " đã đầy (" + occupiedCount + "/" + lot.getCapacity() + ")");
        }

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;

        ParkingSession session = new ParkingSession();
        session.setVehicle(vehicle);
        session.setParkingLot(lot);
        session.setCheckinStaff(staff);
        session.setEntryGate(request.getEntryGate() != null && !request.getEntryGate().isBlank() ? request.getEntryGate().trim() : "Cổng chính");
        session.setCheckinTime(LocalDateTime.now());
        session.setStatus("ACTIVE");
        session.setNote(request.getNote());

        ParkingSession saved = parkingSessionRepository.save(session);
        return ParkingSessionResponseDto.fromEntity(saved);
    }

    /**
     * [Staff] Ghi nhận xe RA khỏi bãi (Check-out)
     * Thao tác trong 1 Transaction, đóng ParkingSession đang mở và giải phóng chỗ trống
     */
    public ParkingSessionResponseDto checkOut(Long staffId, CheckOutRequest request) {
        String input = request.getQrOrPlate();
        if (input == null || input.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã QR hoặc biển số không được để trống");
        }
        Vehicle vehicle = resolveVehicle(input);

        // 1. Kiểm tra session ACTIVE đang mở của xe
        ParkingSession activeSession = parkingSessionRepository.findByVehicleIdAndStatus(vehicle.getId(), "ACTIVE")
                .orElseThrow(() -> new BusinessException(ErrorCode.NO_ACTIVE_SESSION,
                        "Xe " + vehicle.getLicensePlate() + " hiện không có lượt gửi đang mở trong bãi để cho RA"));

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;

        // 2. Cập nhật lượt gửi hoàn tất
        activeSession.setCheckoutStaff(staff);
        activeSession.setExitGate(request.getExitGate() != null && !request.getExitGate().isBlank() ? request.getExitGate().trim() : "Cổng ra chính");
        activeSession.setCheckoutTime(LocalDateTime.now());
        activeSession.setStatus("COMPLETED");
        if (request.getNote() != null && !request.getNote().isBlank()) {
            activeSession.setNote(request.getNote().trim());
        }

        ParkingSession saved = parkingSessionRepository.save(activeSession);
        return ParkingSessionResponseDto.fromEntity(saved);
    }

    /**
     * [Staff] Tra cứu danh sách phương tiện theo từ khóa (Biển số / MSSV / Họ tên / Mã QR)
     */
    @Transactional(readOnly = true)
    public List<StaffVehicleSearchResultDto> searchVehicles(String keyword) {
        List<Vehicle> vehicles = (keyword == null || keyword.isBlank())
                ? vehicleRepository.findAll()
                : vehicleRepository.searchVehicles(keyword.trim());

        return vehicles.stream().map(v -> {
            Optional<ParkingSession> activeSession = parkingSessionRepository.findByVehicleIdAndStatus(v.getId(), "ACTIVE");
            List<UserPackage> activePackages = userPackageRepository.findByUserIdAndStatus(v.getUser().getId(), "ACTIVE");
            boolean hasPackage = VehicleEligibilityPolicy.isEligibleForParking(v, activePackages);
            boolean isParked = activeSession.isPresent();
            ParkingSessionResponseDto sessionDto = activeSession.map(ParkingSessionResponseDto::fromEntity).orElse(null);
            return StaffVehicleSearchResultDto.from(v, hasPackage, isParked, sessionDto);
        }).collect(Collectors.toList());
    }

    /**
     * Tra cứu danh sách các phiên gửi xe đang ACTIVE trong bãi (lọc theo parkingLotId nếu có)
     */
    @Transactional(readOnly = true)
    public List<ParkingSessionResponseDto> getActiveSessions(Long parkingLotId) {
        List<ParkingSession> sessions = parkingLotId != null
                ? parkingSessionRepository.findByParkingLotIdAndStatusOrderByCheckinTimeDesc(parkingLotId, "ACTIVE")
                : parkingSessionRepository.findByStatusOrderByCheckinTimeDesc("ACTIVE");
        return sessions.stream().map(ParkingSessionResponseDto::fromEntity).collect(Collectors.toList());
    }

    /**
     * Tra cứu toàn bộ lịch sử lượt gửi xe toàn hệ thống (hỗ trợ lọc theo bãi)
     */
    @Transactional(readOnly = true)
    public List<ParkingSessionResponseDto> getAllSessionHistory(Long parkingLotId) {
        List<ParkingSession> sessions = parkingLotId != null
                ? parkingSessionRepository.findByParkingLotIdOrderByCheckinTimeDesc(parkingLotId)
                : parkingSessionRepository.findAllByOrderByCheckinTimeDesc();
        return sessions.stream().map(ParkingSessionResponseDto::fromEntity).collect(Collectors.toList());
    }

    /**
     * Tra cứu lịch sử gửi xe của người dùng hiện tại (hỗ trợ lọc theo xe)
     */
    @Transactional(readOnly = true)
    public List<ParkingSessionResponseDto> getMySessionHistory(Long userId, Long vehicleId) {
        List<ParkingSession> sessions = vehicleId != null
                ? parkingSessionRepository.findByVehicleUserIdAndVehicleIdOrderByCheckinTimeDesc(userId, vehicleId)
                : parkingSessionRepository.findByVehicleUserIdOrderByCheckinTimeDesc(userId);
        return sessions.stream().map(ParkingSessionResponseDto::fromEntity).collect(Collectors.toList());
    }

    /**
     * Tìm kiếm phương tiện theo mã QR hoặc biển số
     */
    public Vehicle resolveVehicle(String qrOrPlate) {
        String input = qrOrPlate.trim();
        return vehicleRepository.findByQrToken(input)
                .or(() -> vehicleRepository.findByLicensePlateIgnoreCase(input))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_QR_TOKEN,
                        "Không tìm thấy phương tiện khớp với mã QR hoặc biển số: " + input));
    }
}
