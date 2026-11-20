import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginResponse, UserInfo } from '../../types/api'
import { ACCESS_TOKEN_STORAGE_KEY, ApiError, apiGet, apiPost } from '../api/apiClient'

type AuthContextValue = {
  user: UserInfo | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<UserInfo>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    || localStorage.getItem('accessToken')
    || localStorage.getItem('bk_token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    const syncToken = () => setToken(getStoredToken())
    window.addEventListener('bkparking:auth-changed', syncToken)
    return () => window.removeEventListener('bkparking:auth-changed', syncToken)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    apiGet<UserInfo>('/auth/me')
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setUser(null)
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('bk_token')
          localStorage.removeItem('bk_user')
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(username, password) {
        const response = await apiPost<LoginResponse>('/auth/login', {
          username: username.trim(),
          password,
        })
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.accessToken)
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('bk_token', response.accessToken)
        localStorage.setItem('bk_user', JSON.stringify(response.user))
        window.dispatchEvent(new Event('bkparking:auth-changed'))
        setUser(response.user)
        setToken(response.accessToken)
        return response.user
      },
      logout() {
        localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('bk_token')
        localStorage.removeItem('bk_user')
        window.dispatchEvent(new Event('bkparking:auth-changed'))
        setToken(null)
        setUser(null)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
