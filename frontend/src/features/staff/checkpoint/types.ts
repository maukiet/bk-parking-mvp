export type ScanState = 'idle' | 'reading' | 'valid' | 'warning' | 'invalid' | 'manual';
export type Direction = 'in' | 'out';

export interface ScanResult {
  state: ScanState;
  direction: Direction;
  plateNumber: string; // Biển số đăng ký
  cameraPlate?: string; // Biển số do camera OCR nhận diện
  cameraConfidence?: number; // Độ tin cậy nhận diện (%)
  isPlateMatched: boolean; // So khớp tự động
  vehicleInfo: string;
  ownerName: string;
  ownerRole: string; // SV / GV / NV / Khách vãng lai
  ownerId: string; // MSSV hoặc Mã cán bộ hoặc Mã thẻ cứng
  allowedLots: string;
  invalidReason?: string;
  warningNote?: string;
  checkInTime?: string;
  parkingDuration?: string;
  isOffline?: boolean;
}

export interface RecentEvent {
  id: string;
  time: string;
  plate: string;
  direction: Direction;
  status: 'normal' | 'guest' | 'abnormal';
  person?: string;
  canUndo?: boolean; // TODO(hỏi nhóm: Nút Hoàn tác 30s còn cần không khi lượt hợp lệ đã tự ghi?)
}

export interface LotStatus {
  occupied: number;
  total: number;
  available: number;
  updatedAt: string;
}

export interface ShiftSummaryData {
  totalIn: number;
  totalOut: number;
  guestCardsIssued: number;
  guestCardsCollected: number;
  rejectedCount: number;
  exceptionCount: number;
}

