package vn.edu.hcmut.bkparking.dto;

import vn.edu.hcmut.bkparking.entity.Vehicle;

public class UserVehicleResponseDto {
    private Long id;
    private String licensePlate;
    private String vehicleType;
    private String brand;
    private String model;
    private String color;
    private String registrationDocUrl;
    private String registrationDocBackUrl;
    private String vehiclePhotoUrl;
    private String ownerRelationship;
    private String status;
    private String rejectionReason;
    private String qrToken;
    private boolean currentlyParked;
    private String currentParkingLotName;
    private String createdAt;

    public UserVehicleResponseDto() {}

    public static UserVehicleResponseDto fromEntity(Vehicle v, boolean currentlyParked, String currentLotName) {
        UserVehicleResponseDto dto = new UserVehicleResponseDto();
        dto.id = v.getId();
        dto.licensePlate = v.getLicensePlate();
        dto.vehicleType = v.getVehicleType();
        dto.brand = v.getBrand();
        dto.model = v.getModel();
        dto.color = v.getColor();
        dto.registrationDocUrl = v.getRegistrationDocUrl();
        dto.registrationDocBackUrl = v.getRegistrationDocBackUrl();
        dto.vehiclePhotoUrl = v.getVehiclePhotoUrl();
        dto.ownerRelationship = v.getOwnerRelationship();
        dto.status = v.getStatus();
        dto.rejectionReason = v.getRejectionReason();
        dto.qrToken = v.getQrToken();
        dto.currentlyParked = currentlyParked;
        dto.currentParkingLotName = currentLotName;
        dto.createdAt = v.getCreatedAt() != null ? v.getCreatedAt().toString() : null;
        return dto;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getRegistrationDocBackUrl() { return registrationDocBackUrl; }
    public void setRegistrationDocBackUrl(String registrationDocBackUrl) { this.registrationDocBackUrl = registrationDocBackUrl; }

    public String getVehiclePhotoUrl() { return vehiclePhotoUrl; }
    public void setVehiclePhotoUrl(String vehiclePhotoUrl) { this.vehiclePhotoUrl = vehiclePhotoUrl; }

    public String getOwnerRelationship() { return ownerRelationship; }
    public void setOwnerRelationship(String ownerRelationship) { this.ownerRelationship = ownerRelationship; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getQrToken() { return qrToken; }
    public void setQrToken(String qrToken) { this.qrToken = qrToken; }

    public boolean isCurrentlyParked() { return currentlyParked; }
    public void setCurrentlyParked(boolean currentlyParked) { this.currentlyParked = currentlyParked; }

    public String getCurrentParkingLotName() { return currentParkingLotName; }
    public void setCurrentParkingLotName(String currentParkingLotName) { this.currentParkingLotName = currentParkingLotName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
