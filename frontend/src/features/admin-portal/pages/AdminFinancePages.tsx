import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { AdminPagination } from '../AdminPagination'
import { AdminStatusBadge } from '../AdminStatusBadge'
import { formatAdminDateTime } from '../adminPresentation'
import { buildDemoTransactions, money, transactionTotals, useAdminPackageCatalog, type DemoTransaction } from '../adminOperationalData'

const button = 'min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold'

function FinanceMetrics({ transactions }: { transactions: DemoTransaction[] }) {
  const totals = transactionTotals(transactions)
  const metrics = [
    ['Tổng phải thu', money.format(totals.expected)],
    ['Đã thu', money.format(totals.received)],
    ['Còn chênh lệch', money.format(totals.expected - totals.received)],
    ['Giao dịch khớp', `${totals.matched}/${transactions.length}`],
  ]
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([title, value]) => (
        <div
          key={title}
          className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <dt className="text-sm font-medium leading-snug text-slate-600">{title}</dt>
          <dd className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums sm:text-3xl">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function exportReport(transactions: DemoTransaction[]) {
  const rows = [
    ['Mã giao dịch', 'Gói giữ xe', 'Kênh thu', 'Phải thu (VND)', 'Đã thu (VND)', 'Chênh lệch (VND)'],
    ...transactions.map(row => [row.code, row.description, row.channel, row.expected, row.received, row.expected - row.received]),
  ]
  const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'bk-parking-bao-cao-minh-hoa.csv'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function AdminPaymentsPage() {
  const catalog = useAdminPackageCatalog()
  const transactions = catalog.status === 'ready' ? buildDemoTransactions(catalog.data) : []
  const [exceptions, setExceptions] = useState(false)
  const [selected, setSelected] = useState<DemoTransaction>()
  const [reviewed, setReviewed] = useState<{ code: string; note: string; at: Date }[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = exceptions ? transactions.filter(row => row.expected !== row.received) : transactions
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-5">
      <PageHeader title="Gói giữ xe & Đối soát" description="Đối chiếu số tiền phải thu và số tiền đã nhận theo giao dịch." />
      {catalog.status === 'loading' && <p role="status">Đang tải danh mục gói…</p>}
      {catalog.status === 'error' && <p role="alert">{catalog.message}</p>}
      {catalog.status === 'ready' && !transactions.length && <p>Chưa có gói giữ xe khả dụng.</p>}
      {catalog.status === 'ready' && transactions.length > 0 && <>
      <FinanceMetrics transactions={transactions} />
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="discrepancy-heading">
        <h2 id="discrepancy-heading" className="font-bold">Xử lý chênh lệch</h2>
        <ul className="space-y-2 text-sm">
          {transactions.filter(row => row.expected !== row.received).map(row => (
            <li key={row.code} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <span><strong>{row.code}</strong> · Thiếu {money.format(row.expected - row.received)}</span>
              {reviewed.some(item => item.code === row.code) ? <AdminStatusBadge status="Đã ghi nhận" />
                : <button type="button" className={button} onClick={() => setSelected(row)}>Xem và ghi chú</button>}
            </li>
          ))}
        </ul>
        {selected && (
          <form key={selected.code} className="space-y-3 rounded-xl border border-slate-200 p-3" onSubmit={event => {
            event.preventDefault()
            const note = String(new FormData(event.currentTarget).get('note') ?? '').trim()
            if (!note) return
            setReviewed(items => [{ code: selected.code, note, at: new Date() }, ...items])
            setSelected(undefined)
          }}>
            <label className="block text-sm font-medium">Ghi chú đối soát {selected.code}
              <textarea name="note" required maxLength={500} className="mt-1 block w-full rounded-xl border border-slate-200 p-2" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => setSelected(undefined)}>Hủy</button>
              <button type="submit" className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white">Ghi nhận đối soát</button>
            </div>
          </form>
        )}
      </section>
      <section aria-labelledby="reconciliation-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="reconciliation-heading" className="font-bold">Đối soát giao dịch</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={exceptions} onChange={e => {
            setExceptions(e.target.checked)
            setPage(1)
          }} /> Chỉ xem giao dịch lệch</label>
        </div>
        {!rows.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="font-semibold">Không có giao dịch phù hợp</h3>
            {exceptions && (
              <button type="button" className={`${button} mt-3`} onClick={() => {
                setExceptions(false)
                setPage(1)
              }}>Xóa bộ lọc</button>
            )}
          </section>
        ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50"><tr>{['Mã', 'Gói', 'Kênh thu', 'Phải thu', 'Đã thu', 'Trạng thái'].map(title => <th key={title} scope="col" className="p-3">{title}</th>)}</tr></thead>
              <tbody>{pagedRows.map(row => (
                <tr key={row.code} className="border-t border-slate-100">
                  <th scope="row" className="p-3">{row.code}</th><td className="p-3">{row.description}</td>
                  <td className="p-3">{row.channel}</td><td className="p-3">{money.format(row.expected)}</td>
                  <td className="p-3">{money.format(row.received)}</td>
                  <td className="p-3">
                    <AdminStatusBadge status={row.expected === row.received ? 'Khớp' : row.received === 0 ? 'Chưa nhận tiền' : 'Chênh lệch'} />
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <AdminPagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={rows.length}
            itemLabel="giao dịch"
            onPageChange={setPage}
            onPageSizeChange={size => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
        )}
      </section>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="font-bold">Lịch sử đối soát</h2>
        {!reviewed.length && <p className="text-sm text-slate-600">Chưa có ghi nhận đối soát trong lần mở trang này.</p>}
        <ul className="divide-y divide-slate-100 text-sm" aria-live="polite">
          {reviewed.map(item => <li key={item.code} className="py-3">
            <p><strong>{item.code}</strong> · {formatAdminDateTime(item.at)}</p>
            <p className="mt-1 break-words text-slate-600">{item.note}</p>
          </li>)}
        </ul>
      </section>
      </>}
    </div>
  )
}

export function AdminReportsPage() {
  const catalog = useAdminPackageCatalog()
  const transactions = catalog.status === 'ready' ? buildDemoTransactions(catalog.data) : []
  const totals = transactionTotals(transactions)
  const channels = [...new Set(transactions.map(row => row.channel))]
  return (
    <div className="space-y-5">
      <PageHeader title="Báo cáo & Thống kê" description="Tổng hợp giao dịch gói giữ xe theo kênh thanh toán."
        action={<button type="button" className={`${button} disabled:opacity-50`} disabled={!transactions.length} onClick={() => exportReport(transactions)}>Xuất báo cáo CSV</button>} />
      {catalog.status === 'loading' && <p role="status">Đang tải danh mục gói…</p>}
      {catalog.status === 'error' && <p role="alert">{catalog.message}</p>}
      {catalog.status === 'ready' && !transactions.length && <p>Chưa có gói giữ xe khả dụng.</p>}
      {transactions.length > 0 && <>
      <FinanceMetrics transactions={transactions} />
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="report-channel-heading">
        <h2 id="report-channel-heading" className="font-bold">Số tiền đã thu theo kênh</h2>
        {channels.map(channel => {
          const received = transactions.filter(row => row.channel === channel).reduce((total, row) => total + row.received, 0)
          return (
            <div key={channel} className="space-y-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{channel}</span><strong>{money.format(received)}</strong></div>
              <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-lime-500" style={{ width: `${totals.received ? received / totals.received * 100 : 0}%` }} />
              </div>
            </div>
          )
        })}
      </section>
      </>}
    </div>
  )
}
