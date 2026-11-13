package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmut.bkparking.common.dto.ApiResponse;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.entity.ParkingLot;
import vn.edu.hcmut.bkparking.repository.ParkingLotRepository;
import vn.edu.hcmut.bkparking.repository.ParkingSessionRepository;
import vn.edu.hcmut.bkparking.repository.VehicleRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@Tag(name = "2. Parking Lots, Public View & Admin Dashboard (TV1)", description = "API quản lý 5 bãi đỗ xe, Public View (không cần đăng nhập) và Admin Dashboard Summary")
public class ParkingLotAndDashboardController {

    private final ParkingLotRepository parkingLotRepository;
    private final ParkingSessionRepository parkingSessionRepository;
    private final VehicleRepository vehicleRepository;

    public ParkingLotAndDashboardController(
            ParkingLotRepository parkingLotRepository,
            ParkingSessionRepository parkingSessionRepository,
            VehicleRepository vehicleRepository) {
        this.parkingLotRepository = parkingLotRepository;
        this.parkingSessionRepository = parkingSessionRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public static class UpdateParkingLotRequest {
        private String name;
        private String location;
        @NotNull(message = "Sức chứa không được để trống")
        @Min(value = 0, message = "Sức chứa không được âm")
        private Integer capacity;
        private String status;
        private String allowedVehicleTypes;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getAllowedVehicleTypes() { return allowedVehicleTypes; }
        public void setAllowedVehicleTypes(String allowedVehicleTypes) { this.allowedVehicleTypes = allowedVehicleTypes; }
    }

    @GetMapping("/api/v1/public/parking-lots")
    @Operation(summary = "[Public View] Lấy danh sách bãi đỗ xe và số chỗ trống thời gian thực", description = "Endpoint công khai không yêu cầu đăng nhập cho màn hình Kiosk / Public View")
    public ApiResponse<Map<String, Object>> getPublicParkingLots() {
        List<ParkingLot> lots = parkingLotRepository.findAll();
        List<Map<String, Object>> lotDtos = lots.stream()
                .map(this::toParkingLotDto)
                .collect(Collectors.toList());

        int totalCapacity = lotDtos.stream().mapToInt(m -> (int) m.get("capacity")).sum();
        long totalOccupied = lotDtos.stream().mapToLong(m -> (long) m.get("occupiedCount")).sum();
        long totalAvailable = Math.max(0, totalCapacity - totalOccupied);
        double occupancyRate = totalCapacity > 0
                ? Math.round((totalOccupied * 1000.0) / totalCapacity) / 10.0
                : 0.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalLots", lotDtos.size());
        result.put("totalCapacity", totalCapacity);
        result.put("totalOccupied", totalOccupied);
        result.put("totalAvailable", totalAvailable);
        result.put("overallOccupancyRate", occupancyRate);
        result.put("parkingLots", lotDtos);
        return ApiResponse.ok(result);
    }

    @GetMapping("/api/v1/public/parking-lots/{id}")
    @Operation(summary = "[Public View] Xem chi tiết 1 bãi đỗ xe")
    public ApiResponse<Map<String, Object>> getPublicParkingLotById(@PathVariable Long id) {
        ParkingLot lot = parkingLotRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bãi đỗ xe ID: " + id));
        return ApiResponse.ok(toParkingLotDto(lot));
    }

    @GetMapping("/api/v1/admin/parking-lots")
    @Operation(summary = "[Admin] Lấy danh sách cấu hình và trạng thái tất cả bãi đỗ")
    public ApiResponse<List<Map<String, Object>>> getAdminParkingLots() {
        List<Map<String, Object>> list = parkingLotRepository.findAll().stream()
                .map(this::toParkingLotDto)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    @GetMapping("/api/v1/admin/parking-lots/{id}")
    @Operation(summary = "[Admin] Xem chi tiết cấu hình 1 bãi đỗ")
    public ApiResponse<Map<String, Object>> getAdminParkingLotDetail(@PathVariable Long id) {
        ParkingLot lot = parkingLotRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bãi đỗ xe ID: " + id));
        return ApiResponse.ok(toParkingLotDto(lot));
    }

    @PutMapping("/api/v1/admin/parking-lots/{id}")
    @Transactional
    @Operation(summary = "[Admin] Cập nhật sức chứa và trạng thái bãi đỗ", description = "Ràng buộc: sức chứa mới không được nhỏ hơn số xe hiện đang đỗ (ACTIVE sessions)")
    public ApiResponse<Map<String, Object>> updateParkingLot(
            @PathVariable Long id,
            @Valid @RequestBody UpdateParkingLotRequest request) {
        ParkingLot lot = parkingLotRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bãi đỗ xe ID: " + id));

        long occupiedCount = parkingSessionRepository.countByParkingLotIdAndStatus(lot.getId(), "ACTIVE");
        if (request.getCapacity() < occupiedCount) {
            throw new BusinessException(
                    ErrorCode.CAPACITY_BELOW_OCCUPIED,
                    String.format("Không thể giảm sức chứa xuống %d vì bãi %s hiện đang có %d xe đang đỗ",
                            request.getCapacity(), lot.getName(), occupiedCount));
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            lot.setName(request.getName().trim());
        }
        if (request.getLocation() != null) {
            lot.setLocation(request.getLocation().trim());
        }
        lot.setCapacity(request.getCapacity());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            lot.setStatus(request.getStatus().trim().toUpperCase());
        }
        if (request.getAllowedVehicleTypes() != null && !request.getAllowedVehicleTypes().isBlank()) {
            lot.setAllowedVehicleTypes(request.getAllowedVehicleTypes().trim());
        }
        lot.setUpdatedAt(LocalDateTime.now());
        parkingLotRepository.save(lot);

        return ApiResponse.ok("Cập nhật cấu hình bãi đỗ thành công", toParkingLotDto(lot));
    }

    @GetMapping("/api/v1/admin/dashboard/summary")
    @Operation(summary = "[Admin Dashboard] Số liệu tổng hợp toàn hệ thống", description = "Trả về số liệu 5 bãi xe, đơn đăng ký chờ duyệt, phiên gửi xe đang mở và cảnh báo")
    public ApiResponse<Map<String, Object>> getAdminDashboardSummary() {
        List<ParkingLot> lots = parkingLotRepository.findAll();
        List<Map<String, Object>> lotDtos = lots.stream()
                .map(this::toParkingLotDto)
                .collect(Collectors.toList());

        int totalCapacity = lotDtos.stream().mapToInt(m -> (int) m.get("capacity")).sum();
        long totalOccupied = lotDtos.stream().mapToLong(m -> (long) m.get("occupiedCount")).sum();
        long totalAvailable = Math.max(0, totalCapacity - totalOccupied);
        double overallOccupancyRate = totalCapacity > 0
                ? Math.round((totalOccupied * 1000.0) / totalCapacity) / 10.0
                : 0.0;

        long pendingVehicles = vehicleRepository.countByStatus("PENDING");
        long approvedVehicles = vehicleRepository.countByStatus("APPROVED");
        long rejectedVehicles = vehicleRepository.countByStatus("REJECTED");
        long activeSessions = parkingSessionRepository.countByStatus("ACTIVE");
        long completedSessions = parkingSessionRepository.countByStatus("COMPLETED");

        List<Map<String, Object>> alerts = new ArrayList<>();
        if (pendingVehicles > 0) {
            Map<String, Object> alert = new LinkedHashMap<>();
            alert.put("type", "ACTION_REQUIRED");
            alert.put("title", "Có " + pendingVehicles + " hồ sơ đăng ký phương tiện đang chờ duyệt");
            alert.put("targetRoute", "/admin/vehicles?status=PENDING");
            alerts.add(alert);
        }
        for (Map<String, Object> lotDto : lotDtos) {
            double rate = (double) lotDto.get("occupancyRate");
            if (rate >= 85.0) {
                Map<String, Object> highAlert = new LinkedHashMap<>();
                highAlert.put("type", "WARNING");
                highAlert.put("title", "Bãi " + lotDto.get("name") + " sắp đầy (" + rate + "%)");
                highAlert.put("targetRoute", "/admin/parking-lots");
                alerts.add(highAlert);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalLots", lotDtos.size());
        summary.put("totalCapacity", totalCapacity);
        summary.put("totalOccupied", totalOccupied);
        summary.put("totalAvailable", totalAvailable);
        summary.put("overallOccupancyRate", overallOccupancyRate);
        summary.put("pendingVehicleApprovals", pendingVehicles);
        summary.put("approvedVehiclesCount", approvedVehicles);
        summary.put("rejectedVehiclesCount", rejectedVehicles);
        summary.put("activeSessionsCount", activeSessions);
        summary.put("completedSessionsCount", completedSessions);
        summary.put("parkingLots", lotDtos);
        summary.put("alerts", alerts);
        return ApiResponse.ok(summary);
    }

    private Map<String, Object> toParkingLotDto(ParkingLot lot) {
        long occupiedCount = parkingSessionRepository.countByParkingLotIdAndStatus(lot.getId(), "ACTIVE");
        long availableSlots = Math.max(0, lot.getCapacity() - occupiedCount);
        double occupancyRate = lot.getCapacity() > 0
                ? Math.round((occupiedCount * 1000.0) / lot.getCapacity()) / 10.0
                : 0.0;

        String effectiveStatus = lot.getStatus();
        if ("OPEN".equalsIgnoreCase(effectiveStatus) && availableSlots == 0 && lot.getCapacity() > 0) {
            effectiveStatus = "FULL";
        }

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", lot.getId());
        map.put("code", lot.getCode());
        map.put("name", lot.getName());
        map.put("campus", lot.getCampus());
        map.put("location", lot.getLocation());
        map.put("allowedVehicleTypes", lot.getAllowedVehicleTypes());
        map.put("capacity", lot.getCapacity());
        map.put("occupiedCount", occupiedCount);
        map.put("availableSlots", availableSlots);
        map.put("occupancyRate", occupancyRate);
        map.put("status", effectiveStatus);
        map.put("updatedAt", lot.getUpdatedAt() != null ? lot.getUpdatedAt().toString() : null);
        return map;
    }
}

