import { useEffect, useRef, useState } from 'react'
import type { AdminVehicleDto, ParkingSessionDto } from '../../types/api'
import { AdminConfirmation } from './AdminConfirmation'
import { AdminPagination } from './AdminPagination'
import { AdminStatusBadge } from './AdminStatusBadge'
import { formatAdminDateTime } from './adminPresentation'
import type { SsoSyncLog, SsoUserGroup, SsoUserRecord, SsoUserStatus } from './adminUsersRbacData'

const field = 'min-h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const button = 'min-h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const primary = 'min-h-11 whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

const USER_GROUPS: SsoUserGroup[] = ['Sinh viên', 'Giảng viên', 'Nhân viên']
const USER_STATUSES: SsoUserStatus[] = ['Hoạt động', 'Bị khóa', 'Hết hiệu lực']

interface AdminUsersTabProps {
  users: SsoUserRecord[]
  syncLogs: SsoSyncLog[]
  vehicles: AdminVehicleDto[]
  sessions: ParkingSessionDto[]
  vehiclesLoaded: boolean
  onSyncNow: () => void
  onToggleParkingLock: (code: string, nextStatus: 'Hoạt động' | 'Bị khóa', reason: string) => void
}

export function AdminUsersTab({
  users,
  syncLogs,
  vehicles,
  sessions,
  vehiclesLoaded,
  onSyncNow,
  onToggleParkingLock,
}: AdminUsersTabProps) {
  const [keyword, setKeyword] = useState('')
  const [group, setGroup] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showSyncHistory, setShowSyncHistory] = useState(false)
  const [syncNotice, setSyncNotice] = useState('')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi-VN')
  const filtered = users.filter(user =>
    (!group || user.group === group) &&
    (!status || user.status === status) &&
    (!normalizedKeyword || [user.code, user.fullName].some(value =>
      value.toLocaleLowerCase('vi-VN').includes(normalizedKeyword),
    )),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedUser = selectedCode ? users.find(user => user.code === selectedCode) ?? null : null
  const latestSync = syncLogs[0]

  function vehicleCountFor(user: SsoUserRecord) {
    if (vehiclesLoaded) {
      return vehicles.filter(v => v.ownerCode.toLowerCase() === user.code.toLowerCase()).length
    }
    return user.vehicleCount
  }

  return (
    <div className="space-y-4">
      <section aria-label="Đồng bộ tài khoản SSO" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-semibold text-lime-900">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-lime-600" />
                HCMUT SSO
              </span>
              <p className="text-sm font-semibold text-slate-900">
                Đồng bộ từ SSO lúc 06:00
                {latestSync && <span className="ml-2 font-normal text-slate-500">· Lần gần nhất: {latestSync.syncedAt}</span>}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Tài khoản được cấp tự động theo hồ sơ của trường. Quản trị viên chỉ có thể khóa hoặc mở khóa quyền gửi xe.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={button}
              aria-expanded={showSyncHistory}
              onClick={() => setShowSyncHistory(open => !open)}
            >
              {showSyncHistory ? 'Ẩn lịch sử đồng bộ' : `Lịch sử đồng bộ (${syncLogs.length})`}
            </button>
            <button
              type="button"
              className={primary}
              onClick={() => {
                onSyncNow()
                setSyncNotice('Đã đồng bộ dữ liệu người dùng mới nhất từ HCMUT SSO.')
              }}
            >
              Đồng bộ ngay
            </button>
          </div>
        </div>

        {syncNotice && (
          <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
            {syncNotice}
          </p>
        )}

        {showSyncHistory && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="p-2.5">Mã đợt</th>
                  <th scope="col" className="p-2.5">Thời điểm</th>
                  <th scope="col" className="p-2.5">Nguồn kích hoạt</th>
                  <th scope="col" className="p-2.5">Tổng hồ sơ</th>
                  <th scope="col" className="p-2.5">Cập nhật</th>
                  <th scope="col" className="p-2.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map(log => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <th scope="row" className="p-2.5 font-semibold">{log.id}</th>
                    <td className="p-2.5 tabular-nums">{log.syncedAt}</td>
                    <td className="p-2.5">{log.trigger}</td>
                    <td className="p-2.5 tabular-nums">{log.totalRecords}</td>
                    <td className="p-2.5 tabular-nums">{log.updatedRecords}</td>
                    <td className="p-2.5"><AdminStatusBadge status={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <input
          type="search"
          aria-label="Tìm MSSV, mã cán bộ hoặc họ tên"
          placeholder="Tìm MSSV/mã cán bộ hoặc họ tên"
          className={field}
          value={keyword}
          onChange={event => {
            setKeyword(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Nhóm người dùng"
          className={field}
          value={group}
          onChange={event => {
            setGroup(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả nhóm</option>
          {USER_GROUPS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          aria-label="Trạng thái tài khoản"
          className={field}
          value={status}
          onChange={event => {
            setStatus(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Mọi trạng thái</option>
          {USER_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {!filtered.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="font-semibold">Không có người dùng phù hợp</h2>
          {(keyword || group || status) && (
            <button
              type="button"
              className={`${button} mt-3`}
              onClick={() => {
                setKeyword('')
                setGroup('')
                setStatus('')
                setPage(1)
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </section>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {['MSSV / Mã cán bộ', 'Họ tên', 'Nhóm', 'Trạng thái', 'Số xe', 'Gói', 'Thao tác'].map(label => (
                    <th key={label} scope="col" className="p-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map(user => (
                  <tr key={user.code} className="border-t border-slate-100">
                    <th scope="row" className="p-3 font-semibold tabular-nums">{user.code}</th>
                    <td className="p-3">
                      <span className="font-medium">{user.fullName}</span>
                      <span className="block text-xs text-slate-500">{user.department}</span>
                    </td>
                    <td className="p-3">{user.group}</td>
                    <td className="p-3"><AdminStatusBadge status={user.status} /></td>
                    <td className="p-3 tabular-nums">{vehicleCountFor(user)}</td>
                    <td className="p-3">{user.packageName}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        className={button}
                        aria-label={`Chi tiết ${user.fullName}`}
                        onClick={() => setSelectedCode(user.code)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            itemLabel="người dùng"
            onPageChange={setPage}
            onPageSizeChange={size => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}

      {selectedUser && (
        <UserDetailDrawer
          key={selectedUser.code}
          user={selectedUser}
          liveVehicles={vehicles.filter(v => v.ownerCode.toLowerCase() === selectedUser.code.toLowerCase())}
          liveSessions={sessions.filter(s => s.ownerCode.toLowerCase() === selectedUser.code.toLowerCase())}
          vehiclesLoaded={vehiclesLoaded}
          onClose={() => setSelectedCode(null)}
          onToggleParkingLock={onToggleParkingLock}
        />
      )}
    </div>
  )
}

type UserDrawerTab = 'vehicles' | 'packages' | 'sessions' | 'tickets'

function UserDetailDrawer({
  user,
  liveVehicles,
  liveSessions,
  vehiclesLoaded,
  onClose,
  onToggleParkingLock,
}: {
  user: SsoUserRecord
  liveVehicles: AdminVehicleDto[]
  liveSessions: ParkingSessionDto[]
  vehiclesLoaded: boolean
  onClose: () => void
  onToggleParkingLock: (code: string, nextStatus: 'Hoạt động' | 'Bị khóa', reason: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [subTab, setSubTab] = useState<UserDrawerTab>('vehicles')
  const [editingLock, setEditingLock] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  const targetNextStatus: 'Hoạt động' | 'Bị khóa' = user.status === 'Bị khóa' ? 'Hoạt động' : 'Bị khóa'
  const vehicleList = vehiclesLoaded
    ? liveVehicles.map(v => ({
        licensePlate: v.licensePlate,
        type: [v.brand, v.model].filter(Boolean).join(' ') || v.vehicleType,
        status: v.status,
      }))
    : user.sampleVehicles
  const sessionList = liveSessions.length > 0
    ? liveSessions.map(s => ({
        lot: s.parkingLotName,
        gate: s.exitGate ? `${s.entryGate ?? 'Cổng vào'} → ${s.exitGate}` : (s.entryGate ?? 'Cổng vào'),
        time: s.checkoutTime ?? s.checkinTime ?? '',
        action: s.status === 'ACTIVE' ? 'Đang gửi' : 'Đã hoàn tất',
      }))
    : user.sampleSessions

  const subTabs: { id: UserDrawerTab; label: string; count: number }[] = [
    { id: 'vehicles', label: 'Xe', count: vehicleList.length },
    { id: 'packages', label: 'Gói', count: user.samplePackages.length },
    { id: 'sessions', label: 'Ra/vào', count: sessionList.length },
    { id: 'tickets', label: 'Ticket', count: user.sampleTickets.length },
  ]

  function requestLockAction(event: React.FormEvent) {
    event.preventDefault()
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do trước khi thực hiện.')
      return
    }
    setError('')
    setConfirming(true)
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="user-drawer-title"
      onClick={event => {
        if (event.target === dialog.current) onClose()
      }}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-lg overflow-y-auto bg-[#faf8ff] text-slate-950 shadow-xl backdrop:bg-slate-950/40"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Hồ sơ người dùng (Chỉ đọc)</p>
          <h2 id="user-drawer-title" className="mt-1 text-xl font-bold">{user.fullName}</h2>
          <p className="text-xs text-slate-500">{user.code} · {user.group}</p>
        </div>
        <button type="button" className={button} onClick={onClose}>Đóng</button>
      </header>

      <div className="space-y-4 p-5">
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Thông tin từ SSO</h3>
            <AdminStatusBadge status={user.status} />
          </div>
          <dl className="space-y-2.5 text-sm">
            {[
              ['MSSV / Mã cán bộ', user.code],
              ['Email trường', user.email],
              ['Đơn vị / Khoa', user.department],
              ['Nhóm đối tượng', user.group],
              ['Nguồn cấp', 'Đồng bộ tự động từ hồ sơ trường'],
              ['Lý do khóa gửi xe', user.lockReason],
            ].filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_1.6fr] gap-2">
                <dt className="text-slate-600">{label}</dt>
                <dd className="break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-slate-100 pt-3">
            {user.status === 'Hết hiệu lực' ? (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Tài khoản đã hết hiệu lực trên hồ sơ trường nên không thể mở khóa gửi xe tại đây.
              </p>
            ) : !editingLock ? (
              <button
                type="button"
                className={user.status === 'Bị khóa' ? primary : button}
                onClick={() => {
                  setEditingLock(true)
                  setReason('')
                  setError('')
                  setConfirming(false)
                }}
              >
                {user.status === 'Bị khóa' ? 'Mở khóa gửi xe' : 'Khóa gửi xe'}
              </button>
            ) : confirming ? (
              <AdminConfirmation
                title={targetNextStatus === 'Bị khóa' ? 'Xác nhận khóa gửi xe' : 'Xác nhận mở khóa gửi xe'}
                confirmLabel={targetNextStatus === 'Bị khóa' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
                busy={false}
                onCancel={() => setConfirming(false)}
                onConfirm={() => {
                  onToggleParkingLock(user.code, targetNextStatus, reason.trim())
                  setEditingLock(false)
                  setConfirming(false)
                  setReason('')
                }}
              >
                {targetNextStatus === 'Bị khóa'
                  ? <>Khóa quyền gửi xe của <strong>{user.fullName}</strong> ({user.code}) với lý do: “{reason.trim()}”.</>
                  : <>Mở khóa quyền gửi xe cho <strong>{user.fullName}</strong> ({user.code}) với lý do: “{reason.trim()}”.</>}
              </AdminConfirmation>
            ) : (
              <form className="space-y-2" onSubmit={requestLockAction}>
                <label className="block text-sm font-medium" htmlFor="lock-reason">
                  {targetNextStatus === 'Bị khóa' ? 'Lý do khóa gửi xe' : 'Lý do mở khóa gửi xe'}
                </label>
                <textarea
                  id="lock-reason"
                  required
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  placeholder="Nhập lý do rõ ràng để lưu nhật ký kiểm tra"
                  className={field}
                />
                {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={button} onClick={() => setEditingLock(false)}>Hủy</button>
                  <button type="submit" className={primary}>Tiếp tục</button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div role="tablist" aria-label="Chi tiết liên quan của người dùng" className="flex flex-wrap gap-1.5">
            {subTabs.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={subTab === item.id}
                className={subTab === item.id ? primary : button}
                onClick={() => setSubTab(item.id)}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>

          {subTab === 'vehicles' && (
            vehicleList.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có phương tiện đăng ký.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {vehicleList.map(vehicle => (
                  <li key={vehicle.licensePlate} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-semibold">{vehicle.licensePlate}</p>
                      <p className="text-xs text-slate-500">{vehicle.type}</p>
                    </div>
                    <AdminStatusBadge status={vehicle.status} />
                  </li>
                ))}
              </ul>
            )
          )}

          {subTab === 'packages' && (
            user.samplePackages.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có gói giữ xe hiệu lực.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {user.samplePackages.map(pkg => (
                  <li key={pkg.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-xs text-slate-500">{pkg.period}</p>
                    </div>
                    <AdminStatusBadge status={pkg.status} />
                  </li>
                ))}
              </ul>
            )
          )}

          {subTab === 'sessions' && (
            sessionList.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa ghi nhận lượt ra/vào gần đây.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {sessionList.map((session, index) => (
                  <li key={`${session.time}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-semibold">{session.lot}</p>
                      <p className="text-xs text-slate-500">{session.gate} · {formatAdminDateTime(session.time) === 'Chưa có thông tin' ? session.time : formatAdminDateTime(session.time)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{session.action}</span>
                  </li>
                ))}
              </ul>
            )
          )}

          {subTab === 'tickets' && (
            user.sampleTickets.length === 0 ? (
              <p className="text-sm text-slate-500">Không có ticket hỗ trợ nào.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {user.sampleTickets.map(ticket => (
                  <li key={ticket.code} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-semibold">{ticket.code} · {ticket.subject}</p>
                      <p className="text-xs text-slate-500">Ngày tạo: {ticket.createdAt}</p>
                    </div>
                    <AdminStatusBadge status={ticket.status} />
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </dialog>
  )
}
