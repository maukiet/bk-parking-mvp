import { useState } from 'react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { AdminPagination } from '../AdminPagination'
import { AdminStatusBadge } from '../AdminStatusBadge'
import { buildDemoReservations, useAdminLotReference, type DemoReservation } from '../adminOperationalData'

const field = 'min-h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const button = 'min-h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const card = 'rounded-2xl border border-slate-200 bg-white'

export function AdminReservationsPage() {
  const lotReference = useAdminLotReference()
  const reservations = lotReference.status === 'ready' ? buildDemoReservations(lotReference.data) : []
  const [keyword, setKeyword] = useState('')
  const [lot, setLot] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<DemoReservation>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi-VN')
  const matches = reservations.filter(item =>
    (!lot || item.lot === lot) && (!status || item.status === status) &&
    (!normalizedKeyword || [item.code, item.owner].some(value =>
      value.toLocaleLowerCase('vi-VN').includes(normalizedKeyword),
    )),
  )
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedMatches = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Đặt chỗ" description="Theo dõi các yêu cầu đặt chỗ tại các bãi xe khả dụng." />
      {lotReference.status === 'loading' && <p role="status">Đang tải danh sách bãi…</p>}
      {lotReference.status === 'error' && <p role="alert">{lotReference.message}</p>}
      {lotReference.status === 'ready' && !reservations.length && <p>Không có bãi ô tô đang hoạt động và còn chỗ để minh họa đặt chỗ.</p>}
      {lotReference.status === 'ready' && reservations.length > 0 && <>
      <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <input type="search" aria-label="Mã đặt chỗ hoặc mã người dùng" placeholder="Tìm mã đặt chỗ hoặc mã người dùng" className={field} value={keyword} onChange={e => {
          setKeyword(e.target.value)
          setPage(1)
        }} />
        <select aria-label="Bãi đỗ" className={field} value={lot} onChange={e => {
          setLot(e.target.value)
          setPage(1)
        }}>
          <option value="">Tất cả bãi</option>
          {[...new Set(reservations.map(item => item.lot))].map(value => <option key={value}>{value}</option>)}
        </select>
        <select aria-label="Trạng thái đặt chỗ" className={field} value={status} onChange={e => {
          setStatus(e.target.value)
          setPage(1)
        }}>
          <option value="">Mọi trạng thái</option>
          {[...new Set(reservations.map(item => item.status))].map(value => <option key={value}>{value}</option>)}
        </select>
      </div>
      {!matches.length ? (
        <section className={`${card} p-8 text-center`}>
          <h2 className="font-semibold">Không có lượt đặt chỗ phù hợp</h2>
          {(keyword || lot || status) && (
            <button
              type="button"
              className={`${button} mt-3`}
              onClick={() => {
                setKeyword('')
                setLot('')
                setStatus('')
                setPage(1)
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </section>
      ) : (
        <>
          <div className={`${card} relative hidden min-w-0 overflow-hidden md:block`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-slate-50"><tr>{['Mã đặt chỗ', 'Người dùng', 'Bãi đỗ', 'Trạng thái', 'Thao tác'].map(title => <th key={title} scope="col" className="p-3">{title}</th>)}</tr></thead>
                <tbody>{pagedMatches.map(item => (
                  <tr key={item.code} className="border-t border-slate-100">
                    <th scope="row" className="p-3">{item.code}</th><td className="p-3">{item.owner}</td>
                    <td className="p-3">{item.lot}</td><td className="p-3"><AdminStatusBadge status={item.status} /></td>
                    <td className="p-3"><button type="button" aria-label={`Chi tiết ${item.code}`} className={button} onClick={() => setSelected(item)}>Chi tiết</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <AdminPagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={matches.length}
              itemLabel="lượt đặt chỗ"
              onPageChange={setPage}
              onPageSizeChange={size => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </div>
          <div className="grid min-w-0 gap-3 md:hidden">
            {pagedMatches.map(item => <article key={item.code} className={`${card} space-y-2 p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{item.code}</h2><AdminStatusBadge status={item.status} /></div>
              <p className="text-sm text-slate-600">{item.owner} · {item.lot}</p>
              <p className="text-sm">Khung giờ {item.time}</p>
              <button type="button" aria-label={`Chi tiết ${item.code}`} className={`${button} w-full`} onClick={() => setSelected(item)}>Chi tiết</button>
            </article>)}
            <div className={`${card} overflow-hidden`}>
              <AdminPagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={matches.length}
                itemLabel="lượt đặt chỗ"
                onPageChange={setPage}
                onPageSizeChange={size => {
                  setPageSize(size)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}
      {selected && (
        <section className={`${card} p-5`} aria-labelledby="reservation-detail">
          <div className="flex items-center justify-between gap-2">
            <h2 id="reservation-detail" className="font-bold">Chi tiết {selected.code}</h2>
            <button type="button" className={button} onClick={() => setSelected(undefined)}>Đóng</button>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">{selected.owner} · {selected.lot} <AdminStatusBadge status={selected.status} /></p>
          <p className="mt-1 text-sm">Khung giờ {selected.time}</p>
        </section>
      )}
      </>}
    </div>
  )
}
