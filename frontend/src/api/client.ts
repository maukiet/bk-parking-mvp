import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('bkparking.accessToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('bk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ParsedApiError {
  status: number;
  code?: string;
  message: string;
  isNetworkError: boolean;
}

export function extractApiError(
  error: unknown,
  fallbackMessage = 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const payload = error.response.data as { code?: string; message?: string } | undefined;
      return {
        status: error.response.status,
        code: payload?.code,
        message: payload?.message || `Yêu cầu thất bại (HTTP ${error.response.status}).`,
        isNetworkError: false,
      };
    }
    return {
      status: 0,
      message: 'Không thể kết nối tới máy chủ Backend. Kiểm tra xem server cổng 8080 đã chạy chưa.',
      isNetworkError: true,
    };
  }
  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message || fallbackMessage,
      isNetworkError: false,
    };
  }
  return {
    status: 0,
    message: fallbackMessage,
    isNetworkError: false,
  };
}
