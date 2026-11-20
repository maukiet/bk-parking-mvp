import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ParkingLotDto, ParkingLotStatus, UpdateParkingLotRequest } from '../../../types/api'
import { PageHeader } from '../../../shared/components/PageHeader'
import { adminErrorMessage } from '../adminApi'
import { AdminConfirmation } from '../AdminConfirmation'
import { getParkingLot, getParkingLots, updateParkingLot } from '../parkingLotsApi'

const statusLabels: Record<ParkingLotStatus, string> = {
  OPEN: 'Hoạt động', FULL: 'Đã đầy', CLOSED: 'Tạm đóng', MAINTENANCE: 'Bảo trì',
}

const vehicleLabels: Record<string, string> = {
  MOTORBIKE: 'Xe máy', ELECTRIC_BIKE: 'Xe điện', BICYCLE: 'Xe đạp',
}
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2'
const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const primary = 'rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

function vehicleTypes(lot: ParkingLotDto) {
  return (lot.allowedVehicleTypes ?? '').split(',').map(value => value.trim()).filter(Boolean)
}

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

export function AdminParkingLotsPage() {
  const [state, setState] = useState<LoadState<ParkingLotDto[]>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getParkingLots(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ status: 'ready', data })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: 'error', message: adminErrorMessage(error) })
    })
    return () => controller.abort()
  }, [attempt])

  const lots = state.status === 'ready' ? state.data : []
  const keyword = query.trim().toLocaleLowerCase('vi-VN')
  const filtered = lots.filter(lot =>
    (!status || lot.status === status) &&
    (!vehicle || vehicleTypes(lot).includes(vehicle)) &&
    `${lot.code} ${lot.name} ${lot.location ?? ''}`.toLocaleLowerCase('vi-VN').includes(keyword),
  )
  const metrics = [
    ['Tổng số bãi', lots.length],
    ['Tổng sức chứa', lots.reduce((sum, lot) => sum + lot.capacity, 0)],
    ['Xe đang đỗ', lots.reduce((sum, lot) => sum + lot.occupiedCount, 0)],
    ['Chỗ còn trống', lots.reduce((sum, lot) => sum + lot.availableSlots, 0)],
  ] as const

  function onSaved(saved: ParkingLotDto) {
    setState(current => current.status === 'ready'
      ? { status: 'ready', data: current.data.map(lot => lot.id === saved.id ? saved : lot) }
      : current)
    setNotice(`Đã cập nhật ${saved.name}.`)
  }

  function openDetails(id: number) {
    setNotice('')
    setSelectedId(id)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Bãi đỗ" description="Xem và cập nhật thông tin cơ bản của các bãi xe." />
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">{notice}</p>}
      {state.status === 'loading' && <p role="status">Đang tải danh sách bãi đỗ…</p>}
      {state.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4">
          <p>{state.message}</p>
          <button type="button" className={button} onClick={() => {
            setState({ status: 'loading' })
            setAttempt(value => value + 1)
          }}>Thử lại</button>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-[#f5f3fa] p-5">
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="mt-2 text-2xl font-bold">{value.toLocaleString('vi-VN')}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <input className={field} type="search" aria-label="Tìm bãi đỗ" placeholder="Tìm theo tên hoặc mã bãi" value={query} onChange={e => setQuery(e.target.value)} />
            <select className={field} aria-label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {Object.entries(statusLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
            <select className={field} aria-label="Loại xe" value={vehicle} onChange={e => setVehicle(e.target.value)}>
              <option value="">Mọi loại xe</option>
              {Object.entries(vehicleLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div role="group" aria-label="Kiểu hiển thị bãi đỗ" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={view === 'table'} className={view === 'table' ? primary : button} onClick={() => setView('table')}>Dạng bảng</button>
            <button type="button" aria-pressed={view === 'cards'} className={view === 'cards' ? primary : button} onClick={() => setView('cards')}>Dạng thẻ</button>
          </div>
          {!filtered.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-semibold">Không có bãi đỗ phù hợp</h2>
              {(query || status || vehicle) && (
                <button type="button" className={`${button} mt-3`} onClick={() => {
                  setQuery('')
                  setStatus('')
                  setVehicle('')
                }}>Xóa bộ lọc</button>
              )}
            </section>
          ) : view === 'cards' ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(lot => (
                <article key={lot.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold">
                    <span className="rounded-lg bg-black px-2 py-1 text-lime-400">{lot.code}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{statusLabels[lot.status]}</span>
                  </div>
                  <div>
                    <h2 className="font-bold">{lot.name}</h2>
                    <p className="text-sm text-slate-600">{lot.location}</p>
                  </div>
                  <p className="text-sm">Đang đỗ <strong>{lot.occupiedCount}/{lot.capacity}</strong> xe · Còn <strong>{lot.availableSlots}</strong> chỗ</p>
                  <p className="text-xs text-slate-600">{vehicleTypes(lot).map(type => vehicleLabels[type] ?? type).join(', ') || '—'}</p>
                  <button type="button" className={button} aria-label={`Xem chi tiết ${lot.name}`} onClick={() => openDetails(lot.id)}>Chi tiết</button>
                </article>
              ))}
            </div>
          ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[730px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>{['Mã', 'Tên bãi và khu vực', 'Loại xe', 'Sức chứa', 'Đang đỗ', 'Còn trống', 'Trạng thái', 'Thao tác'].map(label =>
                  <th key={label} scope="col" className="p-3">{label}</th>,
                )}</tr>
              </thead>
              <tbody>
                {filtered.map(lot => (
                  <tr key={lot.id} className="border-t border-slate-100">
                    <td className="p-3"><span className="inline-block rounded-lg bg-black px-2 py-1 font-semibold text-lime-400">{lot.code}</span></td>
                    <th scope="row" className="p-3 font-semibold">{lot.name}<span className="block text-xs font-normal text-slate-500">{lot.location}</span></th>
                    <td className="p-3">{vehicleTypes(lot).map(type => vehicleLabels[type] ?? type).join(', ') || '—'}</td>
                    <td className="p-3">{lot.capacity}</td>
                    <td className="p-3">{lot.occupiedCount}</td>
                    <td className="p-3">{lot.availableSlots}</td>
                    <td className="p-3">{statusLabels[lot.status]}</td>
                    <td className="p-3"><button type="button" className={button} aria-label={`Xem chi tiết ${lot.name}`} onClick={() => openDetails(lot.id)}>Chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 p-3 text-sm text-slate-600">
              Hiển thị {filtered.length} / {lots.length} bãi
            </p>
          </div>
          )}
        </>
      )}
      {selectedId !== null && (
        <ParkingLotDrawer key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onSaved={onSaved} />
      )}
    </div>
  )
}

function ParkingLotDrawer({ id, onClose, onSaved }: {
  id: number
  onClose: () => void
  onSaved: (lot: ParkingLotDto) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<LoadState<ParkingLotDto>>({ status: 'loading' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<UpdateParkingLotRequest | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getParkingLot(id, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ status: 'ready', data })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: 'error', message: adminErrorMessage(error) })
    })
    return () => controller.abort()
  }, [id])

  const lot = state.status === 'ready' ? state.data : null

  function prepareUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lot || saving || pendingUpdate) return

    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const capacityInput = String(data.get('capacity') ?? '').trim()
    const capacity = Number(capacityInput)
    if (!name) {
      setError('Tên bãi không được để trống.')
      return
    }
    if (!capacityInput || !Number.isInteger(capacity) || capacity < lot.occupiedCount || capacity > 2147483647) {
      setError(`Sức chứa phải là số nguyên, tối thiểu bằng số xe đang đỗ (${lot.occupiedCount}).`)
      return
    }
    setError('')
    setPendingUpdate({
      name,
      capacity,
      location: String(data.get('location') ?? '').trim(),
      status: data.get('status') as ParkingLotStatus,
    })
  }

  async function save() {
    if (!pendingUpdate || saving) return
    setSaving(true)
    setError('')
    try {
      const saved = await updateParkingLot(id, pendingUpdate)
      setState({ status: 'ready', data: saved })
      setPendingUpdate(null)
      setEditing(false)
      onSaved(saved)
    } catch (error) {
      setError(adminErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="parking-drawer-title"
      onCancel={event => {
        event.preventDefault()
        if (!saving) onClose()
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-lg overflow-y-auto bg-[#faf8ff] text-slate-950 shadow-xl backdrop:bg-slate-950/40"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Chi tiết bãi</p>
          <h2 id="parking-drawer-title" className="mt-1 text-xl font-bold">{lot?.name ?? 'Thông tin bãi đỗ'}</h2>
        </div>
        <div className="flex gap-2">
          {lot && !editing && <button type="button" className={primary} onClick={() => setEditing(true)}>Sửa</button>}
          <button type="button" className={button} disabled={saving} onClick={onClose}>Đóng</button>
        </div>
      </header>
      <div className="p-5">
        {state.status === 'loading' && <p role="status">Đang tải chi tiết…</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {lot && (
          <form key={editing ? 'edit' : 'view'} onSubmit={prepareUpdate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Thông tin cơ bản</h3>
            <p className="text-sm">Mã bãi <strong>{lot.code}</strong> · {statusLabels[lot.status]}</p>
            <fieldset disabled={!editing || saving || pendingUpdate !== null} className="space-y-3 disabled:text-slate-600">
              <label className="block text-sm">Tên bãi<input className={field} name="name" defaultValue={lot.name} required /></label>
              <label className="block text-sm">Khu vực<input className={field} name="location" defaultValue={lot.location ?? ''} /></label>
              <label className="block text-sm">Sức chứa<input className={field} name="capacity" type="number" min={lot.occupiedCount} max={2147483647} step={1} defaultValue={lot.capacity} required /></label>
              <p className="text-sm">Đang đỗ {lot.occupiedCount} xe · Còn {lot.availableSlots} chỗ</p>
              {editing && (
                <label className="block text-sm">Trạng thái vận hành
                  <select className={field} name="status" defaultValue={lot.status === 'FULL' ? 'OPEN' : lot.status}>
                    <option value="OPEN">Hoạt động</option><option value="CLOSED">Tạm đóng</option><option value="MAINTENANCE">Bảo trì</option>
                  </select>
                </label>
              )}
            </fieldset>
            {!editing && (
              <div className="space-y-2 text-sm">
                <details open className="rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer font-semibold">Loại xe được phép</summary>
                  <p className="mt-2 text-slate-600">{vehicleTypes(lot).map(type => vehicleLabels[type] ?? type).join(', ') || 'Chưa có thông tin'}</p>
                </details>
                <details className="rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer font-semibold">Cổng, giờ hoạt động và thiết bị</summary>
                  <p className="mt-2 text-slate-600">Các thông tin này chưa có dữ liệu từ hệ thống.</p>
                </details>
                <details className="rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer font-semibold">Sức chứa theo loại xe và chỗ đặt trước</summary>
                  <p className="mt-2 text-slate-600">Hệ thống hiện ghi nhận tổng sức chứa của bãi.</p>
                </details>
                <details className="rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer font-semibold">Thông tin cập nhật</summary>
                  <p className="mt-2 text-slate-600">{lot.updatedAt ? `Cập nhật gần nhất: ${new Date(lot.updatedAt).toLocaleString('vi-VN')}` : 'Chưa có thời gian cập nhật.'}</p>
                </details>
              </div>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {pendingUpdate ? (
              <AdminConfirmation title="Xác nhận cập nhật bãi đỗ" confirmLabel="Xác nhận lưu" busy={saving}
                onCancel={() => { setPendingUpdate(null); setError('') }}
                onConfirm={() => { void save() }}>
                <p>Bãi <strong>{pendingUpdate.name}</strong> · Sức chứa <strong>{pendingUpdate.capacity}</strong> chỗ</p>
                {pendingUpdate.status && <p>Trạng thái mới: {statusLabels[pendingUpdate.status]}</p>}
              </AdminConfirmation>
            ) : editing && (
              <div className="flex justify-end gap-2">
                <button type="button" className={button} disabled={saving} onClick={() => {
                  setEditing(false)
                  setError('')
                }}>Hủy</button>
                <button type="submit" className={primary} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
              </div>
            )}
          </form>
        )}
      </div>
    </dialog>
  )
}
