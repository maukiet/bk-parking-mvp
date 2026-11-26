import { apiClient } from '../../../../api/client';
import type { ApiResponse, StaffVehicleSearchResultDto } from '../../../../types/api';

export const searchApi = {
  searchVehicles: async (
    keyword = '',
    signal?: AbortSignal,
  ): Promise<StaffVehicleSearchResultDto[]> => {
    const clean = keyword.trim();
    const res = await apiClient.get<ApiResponse<StaffVehicleSearchResultDto[]>>(
      '/staff/vehicles/search',
      {
        params: clean ? { keyword: clean } : undefined,
        signal,
      },
    );
    return res.data.data ?? [];
  },
};
