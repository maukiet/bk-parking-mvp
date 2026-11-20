import type { ApiResponse } from '../../types/api'
import { apiBaseUrl, clearSession, getAccessToken } from '../auth/authApi'

export async function requestAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  if (!token) throw new Error('Bạn cần đăng nhập bằng tài khoản Admin.')

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${apiBaseUrl}/admin${path}`, { ...options, headers })
  if (response.status === 401) {
    if (!options.signal?.aborted && getAccessToken() === token) {
      clearSession()
      const next = window.location.pathname + window.location.search
      window.location.replace(`/login?expired=1&next=${encodeURIComponent(next)}`)
    }
    throw new Error('Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.')
  }
  if (response.status === 403) throw new Error('Tài khoản hiện tại không có quyền quản trị.')

  const result: ApiResponse<T> | null = await response.json().catch(() => null)
  if (!response.ok || !result?.success || result.data == null) {
    throw new Error(result?.message || 'Máy chủ không xử lý được yêu cầu. Vui lòng thử lại.')
  }
  return result.data
}

export function adminErrorMessage(error: unknown) {
  if (error instanceof TypeError) return 'Không kết nối được với máy chủ. Hãy kiểm tra backend rồi thử lại.'
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'
}
