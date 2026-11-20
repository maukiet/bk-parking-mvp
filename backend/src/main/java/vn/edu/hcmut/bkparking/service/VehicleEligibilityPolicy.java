package vn.edu.hcmut.bkparking.service;

import vn.edu.hcmut.bkparking.entity.User;
import vn.edu.hcmut.bkparking.entity.UserPackage;
import vn.edu.hcmut.bkparking.entity.Vehicle;

import java.util.List;

public final class VehicleEligibilityPolicy {
    private VehicleEligibilityPolicy() {}

    public static boolean isFacultyOrStaff(User user) {
        return user != null
                && user.getCode() != null
                && user.getCode().trim().toUpperCase().startsWith("CB");
    }

    public static boolean isPayrollEligibleCar(Vehicle vehicle) {
        return vehicle != null
                && "CAR".equalsIgnoreCase(vehicle.getVehicleType())
                && isFacultyOrStaff(vehicle.getUser());
    }

    public static boolean isEligibleForParking(Vehicle vehicle, List<UserPackage> activePackages) {
        return isPayrollEligibleCar(vehicle) || (activePackages != null && !activePackages.isEmpty());
    }
}
