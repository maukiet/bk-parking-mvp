// ============================================================================
// BK Parking MVP - Shared TypeScript API Types (Synced with develop branch)
// Copy file nay vao frontend/src/types/api.ts de dung chung cho TV3, TV4, TV5
// ============================================================================

export type RoleCode = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_STAFF';
export type PortalTarget = 'USER_PORTAL' | 'ADMIN_PORTAL' | 'STAFF_PORTAL';
export type VehicleType = 'MOTORBIKE' | 'ELECTRIC_BIKE' | 'BICYCLE';
export type VehicleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type ParkingLotStatus = 'OPEN' | 'FULL' | 'MAINTENANCE' | 'CLOSED';
export type SessionStatus = 'ACTIVE' | 'COMPLETED';
export type RecommendedAction = 'CHECK_IN' | 'CHECK_OUT' | 'DENY';

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

// --- 1. Auth ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface ActivePackageSummary {
  packageCode: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  code: string;
  email: string;
  phone: string | null;
  department: string | null;
  role: RoleCode;
  roleName: string;
  status: string;
  hasActivePackage: boolean;
  activePackage: ActivePackageSummary | null;
  registeredVehicleCount: number;
  maxVehicleLimit: number;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  portalTarget: PortalTarget;
  user: UserInfo;
}

export interface DemoAccountItem {
  username: string;
  passwordHint: string;
  fullName: string;
  code: string;
  role: RoleCode;
  roleName: string;
  portalTarget: PortalTarget;
}

// --- 2. Parking Lots & Dashboard ---
export interface ParkingLotDto {
  id: number;
  code: string;
  name: string;
  campus: string;
  location: string;
  allowedVehicleTypes: string;
  capacity: number;
  occupiedCount: number;
  availableSlots: number;
  occupancyRate: number;
  status: ParkingLotStatus;
  updatedAt: string | null;
}

export interface PublicParkingLotsResponse {
  totalLots: number;
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  overallOccupancyRate: number;
  parkingLots: ParkingLotDto[];
}

export interface UpdateParkingLotRequest {
  name?: string;
  location?: string;
  capacity: number;
  status?: ParkingLotStatus;
  allowedVehicleTypes?: string;
}

export interface DashboardAlert {
  type: 'ACTION_REQUIRED' | 'WARNING';
  title: string;
  targetRoute: string;
}

export interface AdminDashboardSummary {
  totalLots: number;
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  overallOccupancyRate: number;
  pendingVehicleApprovals: number;
  approvedVehiclesCount: number;
  rejectedVehiclesCount: number;
  activeSessionsCount: number;
  completedSessionsCount: number;
  parkingLots: ParkingLotDto[];
  alerts: DashboardAlert[];
}

// --- 3. Packages & Vehicles ---
export interface ParkingPackageDto {
  id: number;
  code: string;
  name: string;
  description: string;
  vehicleType: VehicleType;
  price: number;
  durationDays: number;
}

export interface UserPackageDto {
  id: number;
  packageCode: string;
  packageName: string;
  vehicleType: string;
  price: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface PackagesOverviewResponse {
  availablePackages: ParkingPackageDto[];
  mySubscriptions: UserPackageDto[];
}

export interface CreateVehicleRequest {
  licensePlate: string;
  vehicleType: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  registrationDocUrl?: string;
}

export interface RejectVehicleRequest {
  reason: string;
}

export interface UserVehicleDto {
  id: number;
  licensePlate: string;
  vehicleType: VehicleType;
  brand: string | null;
  model: string | null;
  color: string | null;
  status: VehicleStatus;
  rejectionReason: string | null;
  qrToken: string | null;
  currentlyParked: boolean;
  currentParkingLotName: string | null;
  createdAt: string | null;
}

export interface AdminVehicleDto extends UserVehicleDto {
  ownerId: number;
  ownerName: string;
  ownerCode: string;
  ownerEmail: string;
  registrationDocUrl: string | null;
  reviewerId: number | null;
  reviewerName: string | null;
  reviewedAt: string | null;
}

export interface VehicleQrResponse {
  vehicleId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  ownerName: string;
  ownerCode: string;
  qrToken: string;
  packageEligible: boolean;
  currentlyInParkingLot: boolean;
  currentParkingLot: string | null;
}

// --- 4. Staff Gate Control & Parking Sessions ---
export interface VerifyQrRequest {
  qrOrPlate?: string;
  qrToken?: string;
}

export interface CheckInRequest {
  qrOrPlate: string;
  parkingLotId: number;
  entryGate?: string;
  note?: string;
}

export interface CheckOutRequest {
  qrOrPlate: string;
  exitGate?: string;
  note?: string;
}

export interface ParkingSessionDto {
  sessionId: number;
  vehicleId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  ownerName: string;
  ownerCode: string;
  parkingLotId: number;
  parkingLotCode: string;
  parkingLotName: string;
  entryGate: string | null;
  exitGate: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  status: SessionStatus;
  note: string | null;
}

export interface VerifyQrResponse {
  valid: boolean;
  recommendedAction: RecommendedAction;
  statusMessage: string;
  vehicleId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  brand: string | null;
  model: string | null;
  color: string | null;
  vehicleStatus: VehicleStatus;
  qrToken: string | null;
  ownerName: string;
  ownerCode: string;
  packageEligible: boolean;
  packageName: string | null;
  validForEntry: boolean;
  validForExit: boolean;
  activeSession: ParkingSessionDto | null;
}

export interface StaffVehicleSearchResultDto {
  vehicleId: number;
  licensePlate: string;
  vehicleType: VehicleType;
  brand: string | null;
  model: string | null;
  color: string | null;
  status: VehicleStatus;
  qrToken: string | null;
  ownerName: string;
  ownerCode: string;
  ownerPhone: string | null;
  packageEligible: boolean;
  currentlyParked: boolean;
  currentParkingLot: string | null;
  activeSession: ParkingSessionDto | null;
}
