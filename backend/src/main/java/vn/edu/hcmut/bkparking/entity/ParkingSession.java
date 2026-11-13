package vn.edu.hcmut.bkparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_sessions")
public class ParkingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checkin_staff_id")
    private User checkinStaff;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checkout_staff_id")
    private User checkoutStaff;

    @Column(name = "entry_gate", length = 50)
    private String entryGate;

    @Column(name = "exit_gate", length = 50)
    private String exitGate;

    @Column(name = "checkin_time", nullable = false)
    private LocalDateTime checkinTime = LocalDateTime.now();

    @Column(name = "checkout_time")
    private LocalDateTime checkoutTime;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(columnDefinition = "TEXT")
    private String note;

    public ParkingSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public ParkingLot getParkingLot() { return parkingLot; }
    public void setParkingLot(ParkingLot parkingLot) { this.parkingLot = parkingLot; }
    public User getCheckinStaff() { return checkinStaff; }
    public void setCheckinStaff(User checkinStaff) { this.checkinStaff = checkinStaff; }
    public User getCheckoutStaff() { return checkoutStaff; }
    public void setCheckoutStaff(User checkoutStaff) { this.checkoutStaff = checkoutStaff; }
    public String getEntryGate() { return entryGate; }
    public void setEntryGate(String entryGate) { this.entryGate = entryGate; }
    public String getExitGate() { return exitGate; }
    public void setExitGate(String exitGate) { this.exitGate = exitGate; }
    public LocalDateTime getCheckinTime() { return checkinTime; }
    public void setCheckinTime(LocalDateTime checkinTime) { this.checkinTime = checkinTime; }
    public LocalDateTime getCheckoutTime() { return checkoutTime; }
    public void setCheckoutTime(LocalDateTime checkoutTime) { this.checkoutTime = checkoutTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

