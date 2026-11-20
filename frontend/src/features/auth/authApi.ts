import type { ApiResponse, LoginRequest, LoginResponse } from '../../types/api'

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '')

export function getAccessToken() {
  return localStorage.getItem('accessToken')
    || localStorage.getItem('bk_token')
    || localStorage.getItem('bkparking.accessToken')
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('bk_token')
  localStorage.removeItem('bkparking.accessToken')
  localStorage.removeItem('bk_user')
  window.dispatchEvent(new Event('bkparking:auth-changed'))
}

export function getStoredRole(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem('bk_user') ?? 'null')?.role
  } catch {
    return undefined
  }
}

export async function login(credentials: LoginRequest) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const result: ApiResponse<LoginResponse> | null = await response.json().catch(() => null)
  if (!response.ok || !result?.success || !result.data?.accessToken || !result.data.user) {
    throw new Error(result?.message || 'Không đăng nhập được. Vui lòng thử lại.')
  }

  return result.data
}

export function saveSession(result: LoginResponse) {
  // Keep the aliases used by the three portals while their branches are integrated.
  localStorage.setItem('bk_user', JSON.stringify(result.user))
  localStorage.setItem('bk_token', result.accessToken)
  localStorage.setItem('accessToken', result.accessToken)
  localStorage.setItem('bkparking.accessToken', result.accessToken)
  window.dispatchEvent(new Event('bkparking:auth-changed'))
}
