import type { ApiResponse } from '../../types/api'

export const ACCESS_TOKEN_STORAGE_KEY = 'bkparking.accessToken'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'
).replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob) &&
    !headers.has('Content-Type')
  ) {
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

export async function apiGetBlob(path: string, signal?: AbortSignal) {
  const headers = new Headers()
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    ?? localStorage.getItem('accessToken')
    ?? localStorage.getItem('bk_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const apiPath = path.startsWith('/api/v1/') ? path.slice('/api/v1'.length) : path
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${apiPath}`, { headers, signal })
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng thử lại.', 0)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined) as ApiResponse<unknown> | undefined
    throw new ApiError(payload?.message || `Yêu cầu thất bại (${response.status}).`, response.status)
  }
  return response.blob()
}

export function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function apiUpload<T>(path: string, body: FormData) {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  })
}

export function apiDelete<T>(path: string) {
  return apiRequest<T>(path, { method: 'DELETE' })
}

export function apiPut<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
