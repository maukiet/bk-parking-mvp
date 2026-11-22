import { useEffect, useState } from 'react'
import type { AdminDashboardSummary } from '../../types/api'
import { getAdminDashboard } from './dashboardApi'

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: AdminDashboardSummary; updatedAt: Date }

export function useAdminDashboard(enabled: boolean) {
  const [state, setState] = useState<DashboardState>({ status: 'loading' })
  const [request, setRequest] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    getAdminDashboard(controller.signal)
      .then(summary => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', summary, updatedAt: new Date() })
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            message: error instanceof TypeError
              ? 'Không kết nối được với máy chủ. Hãy kiểm tra backend rồi thử lại.'
              : error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải số liệu.',
          })
        }
      })
    return () => controller.abort()
  }, [enabled, request])

  function refresh() {
    setState({ status: 'loading' })
    setRequest(value => value + 1)
  }

  return { state, refresh }
}
