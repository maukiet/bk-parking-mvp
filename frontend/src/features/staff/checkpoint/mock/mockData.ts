import type { ScanResult, RecentEvent, LotStatus, ShiftSummaryData } from '../types';

export const mockValidIn: ScanResult = {
  state: 'valid',
  direction: 'in',
  plateNumber: '59X3-456.78',
  cameraPlate: '59X3-456.78',
  cameraConfidence: 99,
  isPlateMatched: true,
  vehicleInfo: 'Xe máy · Honda Vision 110 · Đen',
  ownerName: 'Trần Quốc Bảo',
  ownerRole: 'Sinh viên (SV)',
  ownerId: 'MSSV 2011876',
  allowedLots: 'Bãi A, B',
};

export const mockValidOut: ScanResult = {
  state: 'valid',
  direction: 'out',
  plateNumber: '59X3-456.78',
  cameraPlate: '59X3-456.78',
  cameraConfidence: 98,
  isPlateMatched: true,
  vehicleInfo: 'Xe máy · Honda Vision 110 · Đen',
  ownerName: 'Trần Quốc Bảo',
  ownerRole: 'Sinh viên (SV)',
  ownerId: 'MSSV 2011876',
  allowedLots: 'Bãi A, B',
  checkInTime: '09/11/2026 06:30:00',
  parkingDuration: '1 giờ 15 phút 12 giây',
};

export const mockInvalidMismatch: ScanResult = {
  state: 'invalid',
  direction: 'in',
  plateNumber: '59X3-456.78',
  cameraPlate: '59P1-123.45',
  cameraConfidence: 96,
  isPlateMatched: false,
  vehicleInfo: 'Xe máy · Honda Vision 110 · Đen',
  ownerName: 'Trần Quốc Bảo',
  ownerRole: 'Sinh viên (SV)',
  ownerId: 'MSSV 2011876',
  allowedLots: 'Bãi A, B',
  invalidReason: 'Biển số camera không khớp với biển số đăng ký.',
};

export const mockInvalidExpired: ScanResult = {
  state: 'invalid',
  direction: 'in',
  plateNumber: '59C1-246.80',
  cameraPlate: '59C1-246.80',
  cameraConfidence: 99,
  isPlateMatched: true,
  vehicleInfo: 'Xe máy · Honda AirBlade · Đỏ',
  ownerName: 'Hoàng Gia Phúc',
  ownerRole: 'Nhân viên (NV)',
  ownerId: 'Mã NV 0278',
  allowedLots: 'Bãi A, B',
  invalidReason: 'Gói đỗ xe đã hết hạn / Thẻ bị khóa.',
};

export const mockOfflineManual: ScanResult = {
  state: 'manual',
  direction: 'in',
  plateNumber: '59X3-456.78',
  cameraPlate: '59X3-456.78 (Chưa tự động so khớp)',
  cameraConfidence: 0,
  isPlateMatched: false,
  vehicleInfo: 'Xe máy · Honda Vision 110 · Đen',
  ownerName: 'Trần Quốc Bảo',
  ownerRole: 'Sinh viên (SV)',
  ownerId: 'MSSV 2011876',
  allowedLots: 'Bãi A, B',
  isOffline: true,
};

export const mockRecentEvents: RecentEvent[] = [
  { id: '1', time: '07:44:58', plate: '59P1-123.45', direction: 'in', status: 'normal', person: 'Trần Minh Anh · SV', canUndo: true },
  { id: '2', time: '07:44:36', plate: '59H2-789.01', direction: 'out', status: 'guest', person: 'Khách (Thẻ cứng)' },
  { id: '3', time: '07:44:10', plate: '59X3-456.78', direction: 'in', status: 'normal', person: 'Lê Quốc Huy · SV' },
  { id: '4', time: '07:43:52', plate: '59S2-234.56', direction: 'in', status: 'abnormal', person: 'Phạm Văn Nam' },
  { id: '5', time: '07:43:25', plate: '59F1-678.90', direction: 'out', status: 'normal', person: 'Ngô Thị Mai · GV' },
];

export const mockLotStatus: LotStatus = {
  occupied: 1692,
  total: 1800,
  available: 108,
  updatedAt: '07:45:12',
};

export const mockShiftSummary: ShiftSummaryData = {
  totalIn: 428,
  totalOut: 382,
  guestCardsIssued: 45,
  guestCardsCollected: 38,
  rejectedCount: 4,
  exceptionCount: 3,
};
