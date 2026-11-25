import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createSampleNotifications,
  defaultNotificationSettings,
  type NotificationSettings,
  type UserNotification,
} from './notificationTypes'

interface StoredNotificationState {
  notifications: UserNotification[]
  settings: NotificationSettings
}

interface NotificationCenterValue extends StoredNotificationState {
  isReady: boolean
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  setRead: (ids: string[], read: boolean) => void
  togglePinned: (id: string) => void
  removeNotifications: (ids: string[]) => void
  saveSettings: (settings: NotificationSettings) => void
}

const NotificationCenterContext = createContext<NotificationCenterValue | null>(null)

function copyDefaultSettings(): NotificationSettings {
  return {
    channels: Object.fromEntries(
      Object.entries(defaultNotificationSettings.channels).map(([category, setting]) => [category, { ...setting }]),
    ) as NotificationSettings['channels'],
    quietHours: { ...defaultNotificationSettings.quietHours, days: [...defaultNotificationSettings.quietHours.days] },
  }
}

function isStoredNotification(value: unknown): value is UserNotification {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<UserNotification>
  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.message === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.read === 'boolean'
    && typeof item.pinned === 'boolean'
    && ['session', 'vehicle', 'package', 'support', 'system'].includes(String(item.category))
    && ['action', 'important', 'info', 'success'].includes(String(item.level))
}

function loadState(storageKey: string): StoredNotificationState {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<StoredNotificationState>
      if (Array.isArray(saved.notifications) && saved.notifications.every(isStoredNotification)) {
        return {
          notifications: saved.notifications,
          settings: saved.settings?.channels && saved.settings?.quietHours
            ? saved.settings
            : copyDefaultSettings(),
        }
      }
    }
  } catch {
    // A malformed or blocked browser storage entry falls back to the local sample set.
  }
  return { notifications: createSampleNotifications(), settings: copyDefaultSettings() }
}

export function NotificationCenterProvider({ userId, children }: { userId: number | null; children: ReactNode }) {
  const storageKey = `bkparking.user-notifications.v1:${userId ?? 'guest'}`
  const [loadedKey] = useState(storageKey)
  const [initialState] = useState(() => loadState(storageKey))
  const [notifications, setNotifications] = useState<UserNotification[]>(initialState.notifications)
  const [settings, setSettings] = useState<NotificationSettings>(initialState.settings)

  useEffect(() => {
    if (loadedKey !== storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ notifications, settings }))
    } catch {
      // Keep the notification center usable for this session when browser storage is unavailable.
    }
  }, [loadedKey, notifications, settings, storageKey])

  const markRead = useCallback((id: string) => {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }, [])
  const markAllRead = useCallback(() => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }, [])
  const setRead = useCallback((ids: string[], read: boolean) => {
    const selected = new Set(ids)
    setNotifications((items) => items.map((item) => selected.has(item.id) ? { ...item, read } : item))
  }, [])
  const togglePinned = useCallback((id: string) => {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, pinned: !item.pinned } : item))
  }, [])
  const removeNotifications = useCallback((ids: string[]) => {
    const selected = new Set(ids)
    setNotifications((items) => items.filter((item) => !selected.has(item.id)))
  }, [])
  const saveSettings = useCallback((nextSettings: NotificationSettings) => {
    setSettings(nextSettings)
  }, [])

  const value = useMemo<NotificationCenterValue>(() => ({
    notifications,
    settings,
    isReady: loadedKey === storageKey,
    unreadCount: notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    markRead,
    markAllRead,
    setRead,
    togglePinned,
    removeNotifications,
    saveSettings,
  }), [loadedKey, markAllRead, markRead, notifications, removeNotifications, saveSettings, setRead, settings, storageKey, togglePinned])

  return <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext)
  if (!context) throw new Error('useNotificationCenter must be used inside NotificationCenterProvider')
  return context
}
