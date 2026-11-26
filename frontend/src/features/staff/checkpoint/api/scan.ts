import { apiClient } from '../../../../api/client';
import type {
  ApiResponse,
  CheckInRequest,
  CheckOutRequest,
  ParkingLotDto,
  ParkingSessionDto,
  PublicParkingLotsResponse,
  VerifyQrResponse,
} from '../../../../types/api';

export const scanApi = {
  getParkingLots: async (): Promise<ParkingLotDto[]> => {
    const res = await apiClient.get<ApiResponse<PublicParkingLotsResponse | ParkingLotDto[]>>(
      '/public/parking-lots',
    );
    const data = res.data.data;
    if (Array.isArray(data)) return data;
    return data?.parkingLots ?? [];
  },

  verifyPass: async (qrOrPlate: string, parkingLotId?: number): Promise<VerifyQrResponse> => {
    const res = await apiClient.post<ApiResponse<VerifyQrResponse>>('/staff/qr/verify', {
      qrOrPlate: qrOrPlate.trim(),
      parkingLotId,
    });
    return res.data.data;
  },

  checkIn: async (payload: CheckInRequest): Promise<ParkingSessionDto> => {
    const res = await apiClient.post<ApiResponse<ParkingSessionDto>>(
      '/staff/sessions/check-in',
      payload,
    );
    return res.data.data;
  },

  checkOut: async (payload: CheckOutRequest): Promise<ParkingSessionDto> => {
    const res = await apiClient.post<ApiResponse<ParkingSessionDto>>(
      '/staff/sessions/check-out',
      payload,
    );
    return res.data.data;
  },

  getActiveSessions: async (parkingLotId?: number): Promise<ParkingSessionDto[]> => {
    const res = await apiClient.get<ApiResponse<ParkingSessionDto[]>>('/staff/sessions/active', {
      params: parkingLotId ? { parkingLotId } : undefined,
    });
    return res.data.data ?? [];
  },

  getSessionHistory: async (parkingLotId?: number, limit?: number): Promise<ParkingSessionDto[]> => {
    const res = await apiClient.get<ApiResponse<ParkingSessionDto[]>>('/staff/sessions/history', {
      params: {
        ...(parkingLotId ? { parkingLotId } : {}),
        ...(limit ? { limit } : {}),
      },
    });
    return res.data.data ?? [];
  },
};
