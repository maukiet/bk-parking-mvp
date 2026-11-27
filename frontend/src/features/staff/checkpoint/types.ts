import type {
  ParkingLotDto,
  ParkingSessionDto,
  StaffVehicleSearchResultDto,
  VerifyQrResponse,
} from '../../../types/api';

export type StaffTab = 'dashboard' | 'checkpoint' | 'search' | 'shift';

export type CheckpointPhase = 'idle' | 'verifying' | 'reviewed' | 'submitting';

export interface NotFoundReview {
  query: string;
  message: string;
  suggestions: StaffVehicleSearchResultDto[];
}

export interface CheckpointReview {
  query: string;
  verified: VerifyQrResponse | null;
  notFound: NotFoundReview | null;
}

export interface StaffNotice {
  variant: 'success' | 'danger' | 'info';
  message: string;
}

export interface CheckpointSharedData {
  lots: ParkingLotDto[];
  selectedLot: ParkingLotDto | undefined;
  activeSessions: ParkingSessionDto[];
  sessionHistory: ParkingSessionDto[];
  vehicles: StaffVehicleSearchResultDto[];
}
