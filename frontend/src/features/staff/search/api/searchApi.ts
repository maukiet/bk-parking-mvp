import { apiClient } from '../../../../api/client';
import type { ApiResponse, StaffVehicleSearchResultDto } from '../../../../types/api';
import type { UserRecord } from '../components/UserDetailCard';
import { mockSearchDatabase } from '../mock/searchMockData';

export const searchApi = {
  searchVehicles: async (keyword: string): Promise<UserRecord[]> => {
    try {
      const res = await apiClient.get<ApiResponse<StaffVehicleSearchResultDto[]>>(
        `/staff/vehicles/search?keyword=${encodeURIComponent(keyword)}`
      );
      if (res.data.success && res.data.data.length > 0) {
        return res.data.data.map((dto) => ({
          id: dto.vehicleId.toString(),
          name: dto.ownerName,
          code: dto.ownerCode,
          group: dto.ownerCode.startsWith('GV') ? 'GV' : 'SV',
          plate: dto.licensePlate,
          vehicle: `${dto.brand || 'Xe'} ${dto.model || ''} · ${dto.color || ''}`.trim(),
          isInLot: dto.currentlyParked,
          checkInTime: dto.activeSession?.checkinTime ? dto.activeSession.checkinTime.slice(11, 19) : undefined,
          lotName: dto.currentParkingLot || undefined,
          history: dto.activeSession
            ? [{ time: dto.activeSession.checkinTime || 'Hôm nay', action: 'Vào' as const, lot: dto.currentParkingLot || 'Bãi A1' }]
            : [],
        }));
      }
    } catch {
      // Fallback local search
    }

    const clean = keyword.trim().toLowerCase().replace(/[-.\s]/g, '');
    return mockSearchDatabase.filter(
      (u) =>
        u.code.toLowerCase().replace(/[-.\s]/g, '').includes(clean) ||
        u.plate.toLowerCase().replace(/[-.\s]/g, '').includes(clean)
    );
  },
};
