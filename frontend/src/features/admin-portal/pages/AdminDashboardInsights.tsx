import { Link } from 'react-router'
import type { ParkingLotDto } from '../../../types/api'
import { AdminStatusBadge } from '../AdminStatusBadge'
import { buildDemoReservations, buildDemoTransactions, money, transactionTotals, useAdminPackageCatalog } from '../adminOperationalData'

const panel = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5'

export function AdminDashboardInsights({ lots, revision }: { lots: ParkingLotDto[] | undefined; revision: number }) {
  const catalog = useAdminPackageCatalog(revision)
  const transactions = catalog.status === 'ready' ? buildDemoTransactions(catalog.data) : []
  const totals = transactionTotals(transactions)
  const reservations = lots ? buildDemoReservations(lots) : []
  const reservationStatuses = ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy']
  return (
    <section aria-labelledby="admin-insights" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="admin-insights" className="text-xl font-bold">Đặt chỗ và đối soát</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className={panel}>
          <h3 className="font-bold">Tổng hợp đối soát gói giữ xe</h3>
          {catalog.status === 'loading' && <p role="status">Đang tải danh mục gói…</p>}
          {catalog.status === 'error' && <p role="alert">{catalog.message}</p>}
          {catalog.status === 'ready' && !transactions.length && <p>Chưa có gói khả dụng.</p>}
          {transactions.length > 0 && <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2"><dt>Tổng phải thu</dt><dd className="font-semibold">{money.format(totals.expected)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Đã thu</dt><dd className="font-semibold">{money.format(totals.received)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Còn chênh lệch</dt><dd className="font-semibold">{money.format(totals.discrepancy)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Giao dịch khớp</dt><dd className="font-semibold">{totals.matched}/{totals.count}</dd></div>
          </dl>}
          <div className="flex flex-wrap gap-3 text-sm font-semibold"><Link to="/admin/payments" className="underline">Xem đối soát</Link><Link to="/admin/reports" className="underline">Xem báo cáo</Link></div>
        </article>
        <article className={panel}>
          <h3 className="font-bold">Đặt chỗ ô tô</h3>
          {!lots ? <p role="status">Chưa tải được dữ liệu bãi.</p> : !reservations.length ? <p>Không có bãi ô tô đang hoạt động và còn chỗ để minh họa.</p> : <>
            <p className="text-sm text-slate-600">Tổng {reservations.length} yêu cầu minh họa</p>
            <dl className="space-y-2 text-sm">{reservationStatuses.map(status => <div key={status} className="flex flex-wrap items-center justify-between gap-2"><dt><AdminStatusBadge status={status} /></dt><dd className="font-semibold">{reservations.filter(row => row.status === status).length}</dd></div>)}</dl>
          </>}
          <Link to="/admin/reservations" className="text-sm font-semibold underline">Xem quản lý đặt chỗ</Link>
        </article>
      </div>
    </section>
  )
}
