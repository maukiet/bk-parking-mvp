import { apiClient } from '../../../api/client';
import type { ApiResponse, ParkingLotDto, PublicParkingLotsResponse } from '../../../types/api';

function buildSummaryFromLots(lots: ParkingLotDto[]): PublicParkingLotsResponse {
  const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const totalOccupied = lots.reduce((sum, lot) => sum + lot.occupiedCount, 0);
  const totalAvailable = lots.reduce(
    (sum, lot) => sum + (lot.availableSlots ?? Math.max(0, lot.capacity - lot.occupiedCount)),
    0,
  );
  const overallOccupancyRate =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0;

  return {
    totalLots: lots.length,
    totalCapacity,
    totalOccupied,
    totalAvailable,
    overallOccupancyRate,
    parkingLots: lots,
  };
}

export const publicApi = {
  getPublicOverview: async (signal?: AbortSignal): Promise<PublicParkingLotsResponse> => {
    const res = await apiClient.get<ApiResponse<PublicParkingLotsResponse | ParkingLotDto[]>>(
      '/public/parking-lots',
      { signal },
    );
    const data = res.data.data;
    if (Array.isArray(data)) {
      return buildSummaryFromLots(data);
    }
    if (data && Array.isArray(data.parkingLots)) {
      return data;
    }
    return buildSummaryFromLots([]);
  },

  getParkingLots: async (signal?: AbortSignal): Promise<ParkingLotDto[]> => {
    const overview = await publicApi.getPublicOverview(signal);
    return overview.parkingLots;
  },

  getParkingLotById: async (id: number, signal?: AbortSignal): Promise<ParkingLotDto | null> => {
    const res = await apiClient.get<ApiResponse<ParkingLotDto>>(`/public/parking-lots/${id}`, {
      signal,
    });
    return res.data.data ?? null;
  },
};
