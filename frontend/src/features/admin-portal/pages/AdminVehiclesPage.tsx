import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import type { AdminVehicleDto, VehicleStatus } from '../../../types/api'
import { PageHeader } from '../../../shared/components/PageHeader'
import { adminErrorMessage } from '../adminApi'
import { AdminConfirmation } from '../AdminConfirmation'
import { getAdminVehicle, getAdminVehicles, reviewAdminVehicle } from '../vehiclesApi'

const statuses: Record<VehicleStatus, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', LOCKED: 'Đã khóa',
  CANCELED: 'Đã hủy',
}
const tabs = [
  ['pending', 'Chờ duyệt'], ['vehicles', 'Phương tiện'],
  ['users', 'Người dùng'], ['permissions', 'Phân quyền'],
] as const

const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const primary = 'rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

export function AdminVehiclesPage() {
  const [params, setParams] = useSearchParams()
  const tab = tabs.find(([value]) => value === params.get('tab'))?.[0]
    ?? (params.get('status') === 'PENDING' ? 'pending' : 'vehicles')
  const keyword = params.get('keyword') ?? ''
  const status = tab === 'pending' ? 'PENDING' : params.get('status') ?? ''
  const live = tab === 'pending' || tab === 'vehicles'
  const [result, setResult] = useState<{ key: string; rows?: AdminVehicleDto[]; error?: string }>()
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<number>()
  const [notice, setNotice] = useState('')
  const key = JSON.stringify([tab, status, keyword, attempt])
  const current = result?.key === key ? result : undefined

  useEffect(() => {
    if (!live) return
    const controller = new AbortController()
    getAdminVehicles({ status, keyword }, controller.signal).then(rows => {
      if (!controller.signal.aborted) setResult({ key, rows })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: adminErrorMessage(error) })
    })
    return () => controller.abort()
  }, [key, keyword, live, status])

  function updateSearch(values: Record<string, string>) {
    setParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value)))
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    updateSearch({ tab, keyword: String(form.get('keyword') ?? '').trim(), status })
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Duyệt & Quản lý Phương tiện" description="Xem hồ sơ đăng ký và xử lý yêu cầu chờ duyệt." />
      <nav aria-label="Quản lý phương tiện" className="flex flex-wrap gap-2">
        {tabs.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={tab === value} className={tab === value ? primary : button} onClick={() => {
            setNotice('')
            updateSearch({ tab: value })
          }}>{label}</button>
        ))}
      </nav>
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">{notice}</p>}
      {live ? (
        <>
          <form key={JSON.stringify([tab, keyword])} onSubmit={search} className="flex flex-wrap gap-2">
            <input type="search" name="keyword" aria-label="Biển số, tên hoặc mã chủ xe" placeholder="Tìm biển số, tên hoặc mã chủ xe" className={`${field} w-full sm:max-w-80`} defaultValue={keyword} />
            {tab === 'vehicles' && (
              <select aria-label="Trạng thái hồ sơ" className={field} value={status} onChange={event => updateSearch({ tab, keyword, status: event.target.value })}>
                <option value="">Mọi trạng thái</option>
                {Object.entries(statuses).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            )}
            <button className={button} type="submit">Tìm kiếm</button>
          </form>
          {!current && <p role="status">Đang tải hồ sơ…</p>}
          {current?.error && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4" role="alert">
              <p>{current.error}</p><button type="button" className={button} onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
            </div>
          )}
          {current?.rows && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr>
                  {['Biển số', 'Chủ xe', 'Phương tiện', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}
                </tr></thead>
                <tbody>
                  {current.rows.map(vehicle => (
                    <tr key={vehicle.id} className="border-t border-slate-100">
                      <th scope="row" className="p-3 font-semibold">{vehicle.licensePlate}</th>
                      <td className="p-3">{vehicle.ownerName}<span className="block text-xs text-slate-500">{vehicle.ownerCode}</span></td>
                      <td className="p-3">{[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicle.vehicleType}</td>
                      <td className="p-3">{statuses[vehicle.status]}</td>
                      <td className="p-3"><button type="button" className={button} aria-label={`Xem hồ sơ ${vehicle.licensePlate}`} onClick={() => {
                        setNotice('')
                        setSelected(vehicle.id)
                      }}>Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!current.rows.length && <p className="p-4 text-sm text-slate-600">Không có hồ sơ phù hợp.</p>}
            </div>
          )}
        </>
      ) : <SampleAccounts permissions={tab === 'permissions'} />}
      {selected !== undefined && (
        <VehicleDrawer id={selected} onClose={() => setSelected(undefined)} onReviewed={vehicle => {
          setNotice(`${vehicle.licensePlate} · ${statuses[vehicle.status]}`)
          setAttempt(value => value + 1)
        }} />
      )}
    </div>
  )
}

function SampleAccounts({ permissions }: { permissions: boolean }) {
  const [query, setQuery] = useState('')
  const entries = permissions
    ? [['Quản trị viên', 'Xem hồ sơ và duyệt phương tiện'], ['Cán bộ bãi xe', 'Kiểm soát lượt vào và ra'], ['Người dùng', 'Đăng ký phương tiện']]
    : [['SV-DEMO-01', 'Người dùng'], ['STAFF-DEMO-01', 'Cán bộ bãi xe'], ['ADMIN-DEMO-01', 'Quản trị viên']]
  const matches = entries.filter(entry => entry.join(' ').toLocaleLowerCase('vi-VN').includes(query.trim().toLocaleLowerCase('vi-VN')))
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">{permissions ? 'Vai trò và quyền' : 'Danh sách người dùng'}</h2>
      <p className="my-2 text-sm text-slate-600">Dữ liệu minh họa · chỉ xem</p>
      <input type="search" aria-label={permissions ? 'Tìm vai trò' : 'Tìm người dùng'} value={query}
        onChange={event => setQuery(event.target.value)} placeholder={permissions ? 'Tìm vai trò' : 'Tìm theo mã hoặc vai trò'}
        className={`${field} mb-2 w-full sm:max-w-sm`} />
      <dl className="divide-y divide-slate-100">{matches.map(([label, value]) => (
        <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><dt className="font-medium">{label}</dt><dd>{value}</dd></div>
      ))}</dl>
      {!matches.length && <p className="py-3 text-sm text-slate-600">Không có kết quả phù hợp.</p>}
    </section>
  )
}

function VehicleDocument({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const safeUrl = url && /^https?:\/\//i.test(url) ? url : null
  const isImage = safeUrl && /\.(?:png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(safeUrl)
  return (
    <section aria-label="Giấy đăng ký xe" className="space-y-2 rounded-xl border border-slate-200 p-3">
      <h3 className="text-sm font-semibold">Giấy đăng ký xe</h3>
      {isImage && !failed && (
        <img src={safeUrl} alt="Bản chụp giấy đăng ký xe" referrerPolicy="no-referrer" onError={() => setFailed(true)}
          className="max-h-72 w-full rounded-lg bg-slate-50 object-contain" />
      )}
      {!safeUrl && <p className="text-sm text-slate-600">Hồ sơ chưa có liên kết giấy tờ có thể mở.</p>}
      {safeUrl && (!isImage || failed) && <p className="text-sm text-slate-600">Mở tệp để kiểm tra giấy tờ đính kèm.</p>}
      {safeUrl && <a href={safeUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">Mở giấy tờ trong tab mới</a>}
    </section>
  )
}

function VehicleDrawer({ id, onClose, onReviewed }: {
  id: number
  onClose: () => void
  onReviewed: (vehicle: AdminVehicleDto) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [vehicle, setVehicle] = useState<AdminVehicleDto>()
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [confirmingApproval, setConfirmingApproval] = useState(false)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminVehicle(id, controller.signal).then(data => {
      if (!controller.signal.aborted) setVehicle(data)
    }).catch(error => {
      if (!controller.signal.aborted) setError(adminErrorMessage(error))
    })
    return () => controller.abort()
  }, [id])

  async function review(action: 'approve' | 'reject') {
    if (vehicle?.status !== 'PENDING' || working) return
    if (action === 'reject' && !reason.trim()) {
      setError('Vui lòng nhập lý do từ chối.')
      return
    }
    setWorking(true)
    setError('')
    try {
      const saved = await reviewAdminVehicle(id, action, reason.trim())
      setVehicle(saved)
      setRejecting(false)
      setConfirmingApproval(false)
      onReviewed(saved)
    } catch (error) {
      setError(adminErrorMessage(error))
    } finally {
      setWorking(false)
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="vehicle-title" onCancel={event => {
      event.preventDefault()
      if (!working) onClose()
    }} className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-lg overflow-y-auto bg-[#faf8ff] p-5 text-slate-950 shadow-xl backdrop:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <h2 id="vehicle-title" className="text-xl font-bold">Hồ sơ {vehicle?.licensePlate ?? 'phương tiện'}</h2>
        <button className={button} type="button" onClick={onClose} disabled={working}>Đóng</button>
      </div>
      {!vehicle && !error && <p role="status" className="mt-4">Đang tải hồ sơ…</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {vehicle && (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <dl className="space-y-3 text-sm">
            {[['Chủ xe', vehicle.ownerName], ['Mã chủ xe', vehicle.ownerCode], ['Email', vehicle.ownerEmail],
              ['Loại xe', vehicle.vehicleType], ['Nhãn hiệu', vehicle.brand], ['Mẫu xe', vehicle.model],
              ['Màu', vehicle.color], ['Trạng thái', statuses[vehicle.status]], ['Lý do từ chối', vehicle.rejectionReason],
              ['Người xử lý', vehicle.reviewerName], ['Thời điểm xử lý', vehicle.reviewedAt]].filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_2fr] gap-2"><dt className="text-slate-600">{label}</dt><dd className="break-words font-medium">{value}</dd></div>
            ))}
          </dl>
          <VehicleDocument key={vehicle.registrationDocUrl} url={vehicle.registrationDocUrl} />
          {vehicle.status === 'PENDING' && (rejecting ? (
            <form className="space-y-2" onSubmit={event => { event.preventDefault(); void review('reject') }}>
              <label className="block text-sm font-medium" htmlFor="reject-reason">Lý do từ chối</label>
              <textarea id="reject-reason" className={`${field} w-full`} value={reason} onChange={event => setReason(event.target.value)} required disabled={working} />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={button} disabled={working} onClick={() => { setRejecting(false); setError('') }}>Hủy</button>
                <button type="submit" className={primary} disabled={working}>{working ? 'Đang xử lý…' : 'Xác nhận từ chối'}</button>
              </div>
            </form>
          ) : confirmingApproval ? (
            <AdminConfirmation title="Xác nhận duyệt phương tiện" confirmLabel="Xác nhận duyệt" busy={working}
              onCancel={() => { setConfirmingApproval(false); setError('') }}
              onConfirm={() => { void review('approve') }}>
              Duyệt hồ sơ biển số <strong>{vehicle.licensePlate}</strong>. Hệ thống sẽ cấp mã QR cho phương tiện.
            </AdminConfirmation>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primary} disabled={working} onClick={() => {
                setConfirmingApproval(true)
                setError('')
              }}>{working ? 'Đang xử lý…' : 'Duyệt phương tiện'}</button>
              <button type="button" className={button} disabled={working} onClick={() => { setRejecting(true); setError('') }}>Từ chối</button>
            </div>
          ))}
        </div>
      )}
    </dialog>
  )
}
