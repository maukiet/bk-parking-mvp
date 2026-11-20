package vn.edu.hcmut.bkparking.dto;

import java.util.List;

public class VehicleEligibilityResponseDto {
    private int maxVehicleLimit;
    private long registeredVehicleCount;
    private long pendingVehicleCount;
    private long approvedVehicleCount;
    private boolean canRegister;
    private List<String> allowedVehicleTypes;

    public VehicleEligibilityResponseDto() {}

    public VehicleEligibilityResponseDto(int maxVehicleLimit, long registeredVehicleCount,
            long pendingVehicleCount, long approvedVehicleCount, boolean canRegister,
            List<String> allowedVehicleTypes) {
        this.maxVehicleLimit = maxVehicleLimit;
        this.registeredVehicleCount = registeredVehicleCount;
        this.pendingVehicleCount = pendingVehicleCount;
        this.approvedVehicleCount = approvedVehicleCount;
        this.canRegister = canRegister;
        this.allowedVehicleTypes = allowedVehicleTypes;
    }

    public int getMaxVehicleLimit() { return maxVehicleLimit; }
    public void setMaxVehicleLimit(int maxVehicleLimit) { this.maxVehicleLimit = maxVehicleLimit; }
    public long getRegisteredVehicleCount() { return registeredVehicleCount; }
    public void setRegisteredVehicleCount(long registeredVehicleCount) { this.registeredVehicleCount = registeredVehicleCount; }
    public long getPendingVehicleCount() { return pendingVehicleCount; }
    public void setPendingVehicleCount(long pendingVehicleCount) { this.pendingVehicleCount = pendingVehicleCount; }
    public long getApprovedVehicleCount() { return approvedVehicleCount; }
    public void setApprovedVehicleCount(long approvedVehicleCount) { this.approvedVehicleCount = approvedVehicleCount; }
    public boolean isCanRegister() { return canRegister; }
    public void setCanRegister(boolean canRegister) { this.canRegister = canRegister; }
    public List<String> getAllowedVehicleTypes() { return allowedVehicleTypes; }
    public void setAllowedVehicleTypes(List<String> allowedVehicleTypes) { this.allowedVehicleTypes = allowedVehicleTypes; }
}
