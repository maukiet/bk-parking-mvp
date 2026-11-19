import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'

const tabs = [['list', 'Danh sách'], ['config', 'Cấu hình'], ['blocked', 'Người bị tạm khóa']] as const
const reservations = [
  { code: 'DC-001', owner: 'SV-DEMO-01', lot: 'Bãi A', time: '07:30–11:30', status: 'Đã xác nhận' },
  { code: 'DC-002', owner: 'SV-DEMO-02', lot: 'Bãi B', time: '08:00–12:00', status: 'Chờ xác nhận' },
  { code: 'DC-003', owner: 'SV-DEMO-03', lot: 'Bãi A', time: '13:00–17:00', status: 'Đã hủy' },
]
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const card = 'rounded-2xl border border-slate-200 bg-white'

export function AdminReservationsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>('list')
  const [keyword, setKeyword] = useState('')
  const [lot, setLot] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<(typeof reservations)[number]>()
  const [settings, setSettings] = useState({ advanceDays: 7, graceMinutes: 15, noShowLimit: 3 })
  const [blockedUsers, setBlockedUsers] = useState(['SV-DEMO-04'])
  const [notice, setNotice] = useState('')
  const matches = reservations.filter(item =>
    (!lot || item.lot === lot) && (!status || item.status === status) &&
    `${item.code} ${item.owner}`.toLowerCase().includes(keyword.trim().toLowerCase()),
  )

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Đặt chỗ" description="Theo dõi yêu cầu đặt chỗ và chính sách áp dụng." />
      <p className="text-sm text-slate-600">Dữ liệu minh họa · Thay đổi chỉ áp dụng khi đang mở trang này.</p>
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      <nav aria-label="Quản lý đặt chỗ" className="flex flex-wrap gap-2">
        {tabs.map(([value, title]) => (
          <button key={value} type="button" aria-pressed={tab === value} className={`${field} aria-pressed:bg-black aria-pressed:text-white`} onClick={() => {
            setTab(value)
            setSelected(undefined)
            setNotice('')
          }}>{title}</button>
        ))}
      </nav>
      {tab === 'list' && (
        <>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <input type="search" aria-label="Mã đặt chỗ hoặc mã người dùng" placeholder="Tìm mã đặt chỗ hoặc mã người dùng" className={field} value={keyword} onChange={e => setKeyword(e.target.value)} />
            <select aria-label="Bãi đỗ" className={field} value={lot} onChange={e => setLot(e.target.value)}>
              <option value="">Tất cả bãi</option>
              {[...new Set(reservations.map(item => item.lot))].map(value => <option key={value}>{value}</option>)}
            </select>
            <select aria-label="Trạng thái đặt chỗ" className={field} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {[...new Set(reservations.map(item => item.status))].map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-slate-50"><tr>{['Mã đặt chỗ', 'Người dùng', 'Bãi đỗ', 'Trạng thái', 'Thao tác'].map(title => <th key={title} scope="col" className="p-3">{title}</th>)}</tr></thead>
              <tbody>{matches.map(item => (
                <tr key={item.code} className="border-t border-slate-100">
                  <th scope="row" className="p-3">{item.code}</th><td className="p-3">{item.owner}</td>
                  <td className="p-3">{item.lot}</td><td className="p-3">{item.status}</td>
                  <td className="p-3"><button type="button" className="font-semibold underline" onClick={() => setSelected(item)}>Chi tiết<span className="sr-only"> {item.code}</span></button></td>
                </tr>
              ))}</tbody>
            </table>
            {!matches.length && <p className="p-4 text-sm">Không có lượt đặt chỗ phù hợp.</p>}
          </div>
          {selected && (
            <section className={`${card} p-5`} aria-labelledby="reservation-detail">
              <div className="flex items-center justify-between gap-2">
                <h2 id="reservation-detail" className="font-bold">Chi tiết {selected.code}</h2>
                <button type="button" className={field} onClick={() => setSelected(undefined)}>Đóng</button>
              </div>
              <p className="mt-3 text-sm">{selected.owner} · {selected.lot} · {selected.status}</p>
              <p className="mt-1 text-sm">Khung giờ {selected.time}</p>
            </section>
          )}
        </>
      )}
      {tab === 'config' && (
        <section className={`${card} p-5`}>
          <h2 className="font-bold">Cấu hình đặt chỗ</h2>
          <form className="mt-3 space-y-4" onSubmit={event => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            setSettings({
              advanceDays: Number(data.get('advanceDays')),
              graceMinutes: Number(data.get('graceMinutes')),
              noShowLimit: Number(data.get('noShowLimit')),
            })
            setNotice('Đã lưu cấu hình minh họa.')
          }}>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Đặt trước tối đa (ngày)<input className={`${field} mt-1 block w-full`} name="advanceDays" type="number" required min={1} step={1} defaultValue={settings.advanceDays} /></label>
              <label className="text-sm">Giữ chỗ quá giờ (phút)<input className={`${field} mt-1 block w-full`} name="graceMinutes" type="number" required min={0} step={1} defaultValue={settings.graceMinutes} /></label>
              <label className="text-sm">Ngưỡng vắng mặt (lần)<input className={`${field} mt-1 block w-full`} name="noShowLimit" type="number" required min={1} step={1} defaultValue={settings.noShowLimit} /></label>
            </div>
            <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Lưu cấu hình</button>
          </form>
        </section>
      )}
      {tab === 'blocked' && (
        <section className={`${card} p-5`}>
          <h2 className="font-bold">Người bị tạm khóa</h2>
          {!blockedUsers.length && <p className="mt-3 text-sm text-slate-600">Không có người dùng bị tạm khóa.</p>}
          <ul className="mt-3 space-y-2 text-sm">
            {blockedUsers.map(code => (
              <li key={code} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div><p className="font-semibold">{code}</p><p>Vắng mặt 3 lần · Tạm khóa trong 7 ngày</p></div>
                <button type="button" className={field} onClick={() => {
                  setBlockedUsers(users => users.filter(user => user !== code))
                  setNotice(`Đã mở khóa ${code} trong dữ liệu minh họa.`)
                }}>Mở khóa</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
