import { Link } from 'react-router'

const panel = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5'
const hourlyTraffic = [
  { hour: '06:00', entered: 38, exited: 9 },
  { hour: '07:00', entered: 92, exited: 15 },
  { hour: '08:00', entered: 105, exited: 24 },
  { hour: '09:00', entered: 77, exited: 31 },
  { hour: '10:00', entered: 48, exited: 36 },
  { hour: '11:00', entered: 29, exited: 53 },
]
const dailyRevenue = [240000, 320000, 285000, 380000, 420000, 350000, 280000]
const packages = [
  { label: 'Hiệu lực', count: 84, color: 'bg-green-500' },
  { label: 'Chờ xác nhận phí', count: 12, color: 'bg-sky-500' },
  { label: 'Sắp hết hạn', count: 9, color: 'bg-amber-500' },
  { label: 'Hết hạn', count: 7, color: 'bg-red-500' },
]
const bookings = [
  { label: 'Đã đặt', count: 7, color: 'bg-sky-500' },
  { label: 'Đã đến', count: 5, color: 'bg-green-500' },
  { label: 'Vắng mặt', count: 1, color: 'bg-red-500' },
  { label: 'Còn trống', count: 7, color: 'bg-slate-300' },
]
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

function Breakdown({ rows }: { rows: typeof packages }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <>
      <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {rows.map(row => <div key={row.label} className={row.color} style={{ width: `${row.count / total * 100}%` }} />)}
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-2"><span aria-hidden="true" className={`size-2 rounded-full ${row.color}`} />{row.label}</dt><dd className="font-semibold">{row.count}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

export function AdminDashboardInsights() {
  return (
    <section aria-labelledby="admin-insights" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="admin-insights" className="text-xl font-bold">Thống kê vận hành</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Dữ liệu minh họa</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className={panel}>
          <h3 className="font-bold">Lượt vào/ra theo giờ</h3>
          <p className="text-xs text-slate-600">Đen: lượt vào · Xanh: lượt ra</p>
          <div aria-hidden="true" className="flex h-36 items-end gap-2 border-b border-slate-200">
            {hourlyTraffic.map(row => (
              <div key={row.hour} className="flex h-full flex-1 items-end justify-center gap-0.5" title={`${row.hour}: ${row.entered} vào, ${row.exited} ra`}>
                <div className="w-1/3 rounded-t bg-slate-900" style={{ height: `${row.entered / 105 * 100}%` }} />
                <div className="w-1/3 rounded-t bg-lime-500" style={{ height: `${row.exited / 105 * 100}%` }} />
              </div>
            ))}
          </div>
          <details className="text-sm"><summary className="cursor-pointer">Xem dạng bảng</summary>
            <table className="mt-2 w-full text-left">
              <thead><tr><th scope="col">Giờ</th><th scope="col">Vào</th><th scope="col">Ra</th></tr></thead>
              <tbody>{hourlyTraffic.map(row => <tr key={row.hour}><th scope="row" className="font-normal">{row.hour}</th><td>{row.entered}</td><td>{row.exited}</td></tr>)}</tbody>
            </table>
          </details>
        </article>
        <article className={panel}>
          <h3 className="font-bold">Gói theo trạng thái</h3>
          <Breakdown rows={packages} />
        </article>
        <article className={panel}>
          <h3 className="font-bold">Thu vãng lai theo ngày</h3>
          <p className="text-sm text-slate-600">Tổng 7 ngày <strong>{currency.format(dailyRevenue.reduce((sum, value) => sum + value, 0))}</strong></p>
          <dl className="space-y-2 text-sm">
            {dailyRevenue.map((value, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <dt>{index + 3}/11</dt>
                <dd aria-hidden="true" className="h-2 rounded bg-slate-100"><div className="h-full rounded bg-slate-700" style={{ width: `${value / 420000 * 100}%` }} /></dd>
                <dd>{currency.format(value)}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className={panel}>
          <h3 className="font-bold">Đặt chỗ ô tô hôm nay tại Bãi E</h3>
          <Breakdown rows={bookings} />
          <Link to="/admin/reservations" className="text-sm font-semibold underline">Xem quản lý đặt chỗ</Link>
        </article>
      </div>
      <article className={panel}>
        <h3 className="font-bold">Cảnh báo bất thường gần đây</h3>
        <ul className="divide-y divide-slate-100 text-sm">
          <li className="flex flex-wrap justify-between gap-2 py-3"><span>07:42 · Bãi A · Mã dùng ở hai cổng</span><span className="text-red-800">Chưa xử lý</span></li>
          <li className="flex flex-wrap justify-between gap-2 py-3"><span>07:31 · Bãi B · Ghi nhận vào bãi trùng</span><span className="text-amber-800">Đang xử lý</span></li>
        </ul>
      </article>
    </section>
  )
}
