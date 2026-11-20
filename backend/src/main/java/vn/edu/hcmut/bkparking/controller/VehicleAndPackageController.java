package vn.edu.hcmut.bkparking.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.hcmut.bkparking.common.dto.ApiResponse;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.dto.*;
import vn.edu.hcmut.bkparking.entity.VehicleDocument;
import vn.edu.hcmut.bkparking.entity.UserPackage;
import vn.edu.hcmut.bkparking.repository.ParkingPackageRepository;
import vn.edu.hcmut.bkparking.repository.UserPackageRepository;
import vn.edu.hcmut.bkparking.security.UserPrincipal;
import vn.edu.hcmut.bkparking.service.VehicleDocumentService;
import vn.edu.hcmut.bkparking.service.VehicleService;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@Tag(name = "3. Vehicles, Approval & Packages (TV2 + TV1 Integration)", description = "API đăng ký phương tiện, lấy mã QR, xem gói mẫu và Admin duyệt/từ chối phương tiện")
public class VehicleAndPackageController {

    private final VehicleService vehicleService;
    private final VehicleDocumentService vehicleDocumentService;
    private final ParkingPackageRepository parkingPackageRepository;
    private final UserPackageRepository userPackageRepository;

    public VehicleAndPackageController(
            VehicleService vehicleService,
            VehicleDocumentService vehicleDocumentService,
            ParkingPackageRepository parkingPackageRepository,
            UserPackageRepository userPackageRepository) {
        this.vehicleService = vehicleService;
        this.vehicleDocumentService = vehicleDocumentService;
        this.parkingPackageRepository = parkingPackageRepository;
        this.userPackageRepository = userPackageRepository;
    }

    // =========================================================================
    // 1. GÓI ĐỖ XE
    // =========================================================================

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

        List<Map<String, Object>> myPackages = userPackageRepository.findByUserIdOrderByEndDateDesc(principal.getId())
                .stream().map(up -> {
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

    // =========================================================================
    // 2. PHÂN HỆ USER: TRẢ VỀ UserVehicleResponseDto (KHÔNG LỘ THÔNG TIN ADMIN)
    // =========================================================================

    @GetMapping("/api/v1/vehicles/my")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    @Operation(summary = "[User] Xem danh sách phương tiện của tôi")
    public ApiResponse<List<UserVehicleResponseDto>> getMyVehicles(@AuthenticationPrincipal UserPrincipal principal) {
        List<UserVehicleResponseDto> list = vehicleService.getMyVehicles(principal.getId());
        return ApiResponse.ok(list);
    }

    @GetMapping("/api/v1/vehicles/eligibility")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    @Operation(summary = "[User] Xem hạn mức đăng ký và loại phương tiện được phép")
    public ApiResponse<VehicleEligibilityResponseDto> getVehicleEligibility(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(vehicleService.getEligibility(principal.getId()));
    }

    @PostMapping(value = "/api/v1/vehicles/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_USER')")
    @Operation(summary = "[User] Tải ảnh hồ sơ phương tiện lên")
    public ApiResponse<VehicleDocumentUploadResponseDto> uploadVehicleDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("purpose") String purpose,
            @RequestParam("file") MultipartFile file) {
        VehicleDocumentType documentType;
        try {
            documentType = VehicleDocumentType.valueOf(purpose.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT,
                    "purpose phải là REGISTRATION_FRONT, REGISTRATION_BACK hoặc VEHICLE_PHOTO");
        }
        return ApiResponse.ok(vehicleDocumentService.upload(principal.getId(), documentType, file));
    }

    @GetMapping("/api/v1/vehicles/documents/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    @Operation(summary = "[User/Admin] Xem ảnh hồ sơ nếu là chủ sở hữu hoặc quản trị viên")
    public ResponseEntity<Resource> downloadVehicleDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        VehicleDocumentService.VehicleDocumentDownload download = vehicleDocumentService.loadForUser(
                principal.getId(), principal.getRoleCode(), id);
        VehicleDocument document = download.document();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .contentLength(document.getSizeBytes())
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(document.getOriginalFileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(download.resource());
    }

    @PostMapping("/api/v1/vehicles")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    @Operation(summary = "[User] Đăng ký phương tiện mới", description = "Trạng thái ban đầu là PENDING. Kiểm tra trùng biển số và giới hạn tối đa 2 xe hợp lệ/người dùng.")
    public ApiResponse<UserVehicleResponseDto> registerVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateVehicleRequest request) {
        boolean hasAnyRegistrationSide = request.getRegistrationDocFrontId() != null
                || request.getRegistrationDocBackId() != null;
        if (hasAnyRegistrationSide
                && (request.getRegistrationDocFrontId() == null || request.getRegistrationDocBackId() == null)) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT,
                    "Vui lòng tải cả ảnh mặt trước và mặt sau của giấy đăng ký xe");
        }
        if (request.getRegistrationDocFrontId() != null) {
            request.setRegistrationDocUrl(vehicleDocumentService.resolveOwnedDocumentUrl(
                    principal.getId(), request.getRegistrationDocFrontId(), VehicleDocumentType.REGISTRATION_FRONT));
            request.setRegistrationDocBackUrl(vehicleDocumentService.resolveOwnedDocumentUrl(
                    principal.getId(), request.getRegistrationDocBackId(), VehicleDocumentType.REGISTRATION_BACK));
        }
        if (request.getVehiclePhotoId() != null) {
            request.setVehiclePhotoUrl(vehicleDocumentService.resolveOwnedDocumentUrl(
                    principal.getId(), request.getVehiclePhotoId(), VehicleDocumentType.VEHICLE_PHOTO));
        }
        UserVehicleResponseDto saved = vehicleService.registerVehicle(principal.getId(), request);
        return ApiResponse.ok("Gửi yêu cầu đăng ký phương tiện thành công (Trạng thái: Chờ duyệt)", saved);
    }

    @DeleteMapping("/api/v1/vehicles/{id}")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    @Operation(summary = "[User] Hủy đăng ký phương tiện của tôi")
    public ApiResponse<UserVehicleResponseDto> cancelVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ApiResponse.ok("Đã hủy đăng ký phương tiện", vehicleService.cancelVehicle(principal.getId(), id));
    }

    @GetMapping("/api/v1/vehicles/{id}/qr")
    @Operation(summary = "[User] Mở mã QR gắn với phương tiện đã được duyệt")
    public ApiResponse<VehicleQrResponseDto> getVehicleQr(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        VehicleQrResponseDto qr = vehicleService.getVehicleQr(principal.getId(), principal.getRoleCode(), id);
        return ApiResponse.ok(qr);
    }

    // =========================================================================
    // 3. PHÂN HỆ ADMIN: TRẢ VỀ AdminVehicleResponseDto (ĐẦY ĐỦ THÔNG TIN DUYỆT &
    // AUDIT)
    // =========================================================================

    @GetMapping("/api/v1/admin/vehicles")
    @Operation(summary = "[Admin] Danh sách phương tiện (lọc theo status=PENDING / APPROVED / REJECTED)")
    public ApiResponse<List<AdminVehicleResponseDto>> getAdminVehicles(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        List<AdminVehicleResponseDto> list = vehicleService.getAdminVehicles(status, keyword);
        return ApiResponse.ok("Lấy danh sách xe kiểm duyệt thành công", list);
    }

    @GetMapping("/api/v1/admin/vehicles/{id}")
    @Operation(summary = "[Admin] Xem chi tiết hồ sơ phương tiện")
    public ApiResponse<AdminVehicleResponseDto> getAdminVehicleDetail(@PathVariable Long id) {
        AdminVehicleResponseDto dto = vehicleService.getAdminVehicleDetail(id);
        return ApiResponse.ok(dto);
    }

    @PatchMapping("/api/v1/admin/vehicles/{id}/approve")
    @Operation(summary = "[Admin] Duyệt đăng ký phương tiện", description = "Chuyển trạng thái sang APPROVED và tự động phát hành mã định danh qrToken")
    public ApiResponse<AdminVehicleResponseDto> approveVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        AdminVehicleResponseDto saved = vehicleService.approveVehicle(principal.getId(), id);
        return ApiResponse.ok("Đã duyệt phương tiện và cấp mã QR thành công", saved);
    }

    @PatchMapping("/api/v1/admin/vehicles/{id}/reject")
    @Operation(summary = "[Admin] Từ chối đăng ký phương tiện", description = "Chuyển trạng thái sang REJECTED và lưu lý do từ chối")
    public ApiResponse<AdminVehicleResponseDto> rejectVehicle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RejectVehicleRequest request) {
        AdminVehicleResponseDto saved = vehicleService.rejectVehicle(principal.getId(), id, request);
        return ApiResponse.ok("Đã từ chối hồ sơ đăng ký phương tiện", saved);
    }
}
