import { apiClient } from '../../../../api/client';
import type { ApiResponse, VerifyQrResponse, ParkingSessionDto } from '../../../../types/api';
import type { ScanResult, Direction } from '../types';

export interface VerifyOptions {
  rawCode: string;
  isOffline?: boolean;
}

const mockVehicles = [
  { plate: '59X3-682.45', ownerId: '2311770', ownerName: 'Nguyễn Văn An', vehicleInfo: 'Honda AirBlade 125 · Đen Bạc' },
  { plate: '59P1-123.45', ownerId: '2112345', ownerName: 'Trần Minh Anh', vehicleInfo: 'Honda Vision 110 · Đỏ' },
  { plate: '51A-123.45', ownerId: 'GV-0421', ownerName: 'Nguyễn Thị Hoa', vehicleInfo: 'Toyota Vios · Trắng' },
];

export const scanApi = {
  verifyPass: async ({ rawCode, isOffline = false }: VerifyOptions): Promise<ScanResult> => {
    if (!isOffline) {
      try {
        const res = await apiClient.post<ApiResponse<VerifyQrResponse>>('/staff/qr/verify', {
          qrOrPlate: rawCode.trim(),
        });
        const d = res.data.data;
        const dir: Direction = d.recommendedAction === 'CHECK_OUT' ? 'out' : 'in';
        return {
          state: d.valid ? 'valid' : 'invalid',
          direction: dir,
          plateNumber: d.licensePlate,
          cameraPlate: d.licensePlate,
          cameraConfidence: 98,
          isPlateMatched: true,
          vehicleInfo: `${d.brand || 'Xe'} ${d.model || ''} · ${d.color || ''}`.trim(),
          ownerName: d.ownerName,
          ownerRole: d.ownerCode.startsWith('GV') ? 'Giảng viên' : 'Sinh viên',
          ownerId: d.ownerCode,
          allowedLots: d.packageName || 'Bãi A1',
          invalidReason: !d.valid ? d.statusMessage : undefined,
          checkInTime: d.activeSession?.checkinTime ? d.activeSession.checkinTime.slice(11, 19) : undefined,
        };
      } catch {
        // Fallback sang local simulation khi backend offline
      }
    }

    const clean = rawCode.trim().toUpperCase().replace(/[-.\s]/g, '');
    const found = mockVehicles.find((v) => v.plate.replace(/[-.\s]/g, '').includes(clean) || v.ownerId.includes(clean));

    if (isOffline) {
      const plate = found ? found.plate : rawCode.toUpperCase();
      return {
        state: 'manual',
        direction: 'in',
        plateNumber: plate,
        cameraPlate: `${plate} (Chưa đối chiếu)`,
        cameraConfidence: 0,
        isPlateMatched: false,
        vehicleInfo: found?.vehicleInfo || 'Cần đối chiếu ảnh camera',
        ownerName: found?.ownerName || 'Hồ sơ ngoại tuyến',
        ownerRole: 'Sinh viên (SV)',
        ownerId: found?.ownerId || rawCode,
        allowedLots: 'Nhà xe Khu A1',
        isOffline: true,
      };
    }

    if (!found) {
      return {
        state: 'invalid',
        direction: 'in',
        plateNumber: rawCode.toUpperCase(),
        cameraPlate: rawCode.toUpperCase(),
        cameraConfidence: 95,
        isPlateMatched: true,
        vehicleInfo: 'Phương tiện chưa đăng ký trên hệ thống',
        ownerName: 'Không xác định',
        ownerRole: 'Khách',
        ownerId: 'N/A',
        allowedLots: 'Không',
        invalidReason: 'Xe chưa đăng ký trong hệ thống bãi xe ĐHBK.',
      };
    }

    return {
      state: 'valid',
      direction: 'in',
      plateNumber: found.plate,
      cameraPlate: found.plate,
      cameraConfidence: 99,
      isPlateMatched: true,
      vehicleInfo: found.vehicleInfo,
      ownerName: found.ownerName,
      ownerRole: 'Sinh viên (SV)',
      ownerId: found.ownerId,
      allowedLots: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)',
    };
  },

  checkIn: async (qrOrPlate: string, parkingLotId = 1): Promise<ParkingSessionDto | null> => {
    try {
      const res = await apiClient.post<ApiResponse<ParkingSessionDto>>('/staff/sessions/check-in', {
        qrOrPlate,
        parkingLotId,
        entryGate: 'Cổng A1 - Làn 1',
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  checkOut: async (qrOrPlate: string): Promise<ParkingSessionDto | null> => {
    try {
      const res = await apiClient.post<ApiResponse<ParkingSessionDto>>('/staff/sessions/check-out', {
        qrOrPlate,
        exitGate: 'Cổng A1 - Làn 2',
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  confirmAction: async (action: 'allow' | 'reject' | 'exception', plate: string, dir: Direction = 'in'): Promise<boolean> => {
    if (action === 'allow') {
      if (dir === 'in') await scanApi.checkIn(plate);
      else await scanApi.checkOut(plate);
    }
    return true;
  },
};
