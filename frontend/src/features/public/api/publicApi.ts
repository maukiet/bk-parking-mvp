import { apiClient } from '../../../api/client';
import type { ApiResponse, PublicParkingLotsResponse, ParkingLotDto } from '../../../types/api';

const mockLots: ParkingLotDto[] = [
  {
    id: 1,
    code: 'LOT_A1',
    name: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)',
    campus: 'CS1_LTK',
    location: 'Cổng số 1 - 268 Lý Thường Kiệt, Q.10',
    allowedVehicleTypes: 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE',
    capacity: 200,
    occupiedCount: 188,
    availableSlots: 12,
    occupancyRate: 94.0,
    status: 'OPEN',
    updatedAt: '2026-11-16T12:00:00',
  },
  {
    id: 2,
    code: 'LOT_B1',
    name: 'Bãi B1 – Khu A1–A5',
    campus: 'CS1_LTK',
    location: 'Cơ sở 1 (Khu A)',
    allowedVehicleTypes: 'MOTORBIKE,ELECTRIC_BIKE',
    capacity: 150,
    occupiedCount: 132,
    availableSlots: 18,
    occupancyRate: 88.0,
    status: 'OPEN',
    updatedAt: '2026-11-16T11:58:00',
  },
  {
    id: 3,
    code: 'LOT_C1',
    name: 'Bãi C1 – Khu B1–B4',
    campus: 'CS1_LTK',
    location: 'Cơ sở 1 (Khu B)',
    allowedVehicleTypes: 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE',
    capacity: 120,
    occupiedCount: 86,
    availableSlots: 34,
    occupancyRate: 71.7,
    status: 'OPEN',
    updatedAt: '2026-11-16T11:55:00',
  },
  {
    id: 4,
    code: 'LOT_D_KTX',
    name: 'Bãi D – Ký túc xá',
    campus: 'KTX',
    location: '497 Hòa Hảo, Q.10',
    allowedVehicleTypes: 'MOTORBIKE,BICYCLE',
    capacity: 100,
    occupiedCount: 55,
    availableSlots: 45,
    occupancyRate: 55.0,
    status: 'OPEN',
    updatedAt: '2026-11-16T11:50:00',
  },
  {
    id: 5,
    code: 'LOT_E_ADMIN',
    name: 'Bãi E – Khu Hiệu bộ & Giảng viên',
    campus: 'CS1_LTK',
    location: 'Nhà A4 - Cơ sở 1',
    allowedVehicleTypes: 'MOTORBIKE,ELECTRIC_BIKE',
    capacity: 50,
    occupiedCount: 46,
    availableSlots: 4,
    occupancyRate: 92.0,
    status: 'OPEN',
    updatedAt: '2026-11-16T12:00:00',
  },
];

export const publicApi = {
  getParkingLots: async (): Promise<ParkingLotDto[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PublicParkingLotsResponse | ParkingLotDto[]>>(
        '/public/parking-lots'
      );
      const data = res.data.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.parkingLots)) return data.parkingLots;
      return mockLots;
    } catch {
      return mockLots;
    }
  },

  getParkingLotById: async (id: number): Promise<ParkingLotDto | null> => {
    try {
      const res = await apiClient.get<ApiResponse<ParkingLotDto>>(`/public/parking-lots/${id}`);
      return res.data.data;
    } catch {
      return mockLots.find((l) => l.id === id) || null;
    }
  },
};
