package vn.edu.hcmut.bkparking.dto;

import vn.edu.hcmut.bkparking.entity.Vehicle;

public class AdminVehicleResponseDto extends UserVehicleResponseDto {

    // Các thuộc tính chỉ Admin mới có quyền xem:
    private Long ownerId;
    private String ownerName;
    private String ownerCode;
    private String ownerEmail;
    private Long reviewerId;
    private String reviewerName;
    private String reviewedAt;

    public AdminVehicleResponseDto() {
        super();
    }

    public static AdminVehicleResponseDto fromEntity(Vehicle v, boolean currentlyParked, String currentLotName) {
        AdminVehicleResponseDto dto = new AdminVehicleResponseDto();

        // 1. Gán các trường của UserVehicleResponseDto
        dto.setId(v.getId());
        dto.setLicensePlate(v.getLicensePlate());
        dto.setVehicleType(v.getVehicleType());
        dto.setBrand(v.getBrand());
        dto.setModel(v.getModel());
        dto.setColor(v.getColor());
        dto.setRegistrationDocUrl(v.getRegistrationDocUrl());
        dto.setRegistrationDocBackUrl(v.getRegistrationDocBackUrl());
        dto.setVehiclePhotoUrl(v.getVehiclePhotoUrl());
        dto.setOwnerRelationship(v.getOwnerRelationship());
        dto.setStatus(v.getStatus());
        dto.setRejectionReason(v.getRejectionReason());
        dto.setQrToken(v.getQrToken());
        dto.setCurrentlyParked(currentlyParked);
        dto.setCurrentParkingLotName(currentLotName);
        dto.setCreatedAt(v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);

        // 2. Gán các trường bảo mật dành riêng cho Admin
        if (v.getUser() != null) {
            dto.ownerId = v.getUser().getId();
            dto.ownerName = v.getUser().getFullName();
            dto.ownerCode = v.getUser().getCode();
            dto.ownerEmail = v.getUser().getEmail();
        }
        if (v.getReviewedBy() != null) {
            dto.reviewerId = v.getReviewedBy().getId();
            dto.reviewerName = v.getReviewedBy().getFullName();
        }
        dto.reviewedAt = v.getReviewedAt() != null ? v.getReviewedAt().toString() : null;

        return dto;
    }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerCode() { return ownerCode; }
    public void setOwnerCode(String ownerCode) { this.ownerCode = ownerCode; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; }
}
