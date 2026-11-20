import type { ApiResponse } from '../../types/api'

export const ACCESS_TOKEN_STORAGE_KEY = 'bkparking.accessToken'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    ?? localStorage.getItem('accessToken')
    ?? localStorage.getItem('bk_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng thử lại.', 0)
  }

  let payload: ApiResponse<T> | undefined
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    // Keep the HTTP status as the useful error when the response has no JSON body.
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || `Yêu cầu thất bại (${response.status}).`,
      response.status,
    )
  }

  return payload.data
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path)
}

export function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function apiPut<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
