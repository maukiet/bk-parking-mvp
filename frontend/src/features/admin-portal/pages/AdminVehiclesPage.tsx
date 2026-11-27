import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { AdminVehicleDto } from '../../../types/api'
import { PageHeader } from '../../../shared/components/PageHeader'
import { apiGetBlob, apiRequest } from '../../../shared/api/apiClient'
import { adminErrorMessage } from '../adminApi'
import { AdminConfirmation } from '../AdminConfirmation'
import { useAdminLotReference, useAdminSessionHistory } from '../adminOperationalData'
import { AdminPagination } from '../AdminPagination'
import { AdminPermissionsTab } from '../AdminPermissionsTab'
import { AdminUsersTab } from '../AdminUsersTab'
import {
  INITIAL_PERMISSION_MATRIX,
  INITIAL_ROLE_ASSIGNMENTS,
  INITIAL_ROLE_AUDIT_LOGS,
  INITIAL_SSO_USERS,
  INITIAL_SYNC_LOGS,
  mergeDirectoryUsers,
  type DirectoryAccountItem,
} from '../adminUsersRbacData'
import { getAdminVehicle, getAdminVehicles, reviewAdminVehicle } from '../vehiclesApi'
import { AdminStatusBadge } from '../AdminStatusBadge'
import { formatAdminDateTime, vehicleStatuses as statuses, vehicleTypeLabel } from '../adminPresentation'

const tabs = [
  ['pending', 'Chờ duyệt'], ['vehicles', 'Phương tiện'],
  ['users', 'Người dùng'], ['permissions', 'Phân quyền'],
] as const

const field = 'min-h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const button = 'min-h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const primary = 'min-h-11 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

export function AdminVehiclesPage() {
  const [params, setParams] = useSearchParams()
  const tab = tabs.find(([value]) => value === params.get('tab'))?.[0]
    ?? (params.get('status') === 'PENDING' ? 'pending' : 'vehicles')
  const status = tab === 'pending' ? 'PENDING' : tab === 'vehicles' ? (params.get('status') ?? '') : ''
  const live = tab === 'pending' || tab === 'vehicles'
  const lotReference = useAdminLotReference()
  const sessionHistory = useAdminSessionHistory()
  const [accounts, setAccounts] = useState<DirectoryAccountItem[]>([])
  const [keyword, setKeyword] = useState(() => params.get('keyword') ?? '')
  const [result, setResult] = useState<{ key: string; rows?: AdminVehicleDto[]; error?: string }>()
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<number>()
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ssoUsers, setSsoUsers] = useState(INITIAL_SSO_USERS)
  const [syncLogs, setSyncLogs] = useState(INITIAL_SYNC_LOGS)
  const [assignments, setAssignments] = useState(INITIAL_ROLE_ASSIGNMENTS)
  const [matrix, setMatrix] = useState(INITIAL_PERMISSION_MATRIX)
  const [roleAuditLogs, setRoleAuditLogs] = useState(INITIAL_ROLE_AUDIT_LOGS)
  const key = JSON.stringify([live ? tab : 'all', status, attempt])
  const current = result?.key === key ? result : undefined

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<DirectoryAccountItem[]>('/auth/demo-accounts', { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted && Array.isArray(data)) setAccounts(data)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (tab === 'permissions') return
    const controller = new AbortController()
    getAdminVehicles({ status, keyword: '' }, controller.signal).then(rows => {
      if (!controller.signal.aborted) setResult({ key, rows })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: adminErrorMessage(error) })
    })
    return () => controller.abort()
  }, [key, status, tab])

  const mergedUsers = useMemo(
    () => mergeDirectoryUsers(ssoUsers, current?.rows ?? [], accounts),
    [ssoUsers, current?.rows, accounts],
  )

  function updateSearch(values: Record<string, string>) {
    setParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value)))
  }

  function handleSyncNow() {
    const nowLabel = formatAdminDateTime(new Date())
    setSyncLogs(prev => [
      {
        id: `SYNC-${String(prev.length + 1).padStart(2, '0')}`,
        syncedAt: nowLabel,
        trigger: 'Thủ công (Quản trị viên)',
        totalRecords: mergedUsers.length,
        updatedRecords: 1,
        status: 'Thành công',
      },
      ...prev,
    ])
  }

  function handleToggleParkingLock(code: string, nextStatus: 'Hoạt động' | 'Bị khóa', reason: string) {
    setSsoUsers(prev => {
      const exists = prev.some(user => user.code.toLowerCase() === code.toLowerCase())
      if (exists) {
        return prev.map(user => (
          user.code.toLowerCase() === code.toLowerCase()
            ? {
                ...user,
                status: nextStatus,
                lockReason: nextStatus === 'Bị khóa' ? reason : undefined,
              }
            : user
        ))
      }
      const target = mergedUsers.find(user => user.code.toLowerCase() === code.toLowerCase())
      if (!target) return prev
      return [
        ...prev,
        {
          ...target,
          status: nextStatus,
          lockReason: nextStatus === 'Bị khóa' ? reason : undefined,
        },
      ]
    })
  }

  function handleAssignRole(payload: {
    userCode: string
    userName: string
    role: typeof assignments[number]['role']
    lotName: string
    gateName: string
    validUntil: string
  }) {
    const now = new Date()
    const assignedDate = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now)
    const id = `RA-${String(assignments.length + 1).padStart(2, '0')}`
    setAssignments(prev => [
      {
        id,
        userCode: payload.userCode,
        userName: payload.userName,
        role: payload.role,
        lotName: payload.lotName,
        gateName: payload.gateName,
        status: 'Đang hiệu lực',
        assignedAt: assignedDate,
        validUntil: payload.validUntil,
      },
      ...prev,
    ])
    setRoleAuditLogs(prev => [
      {
        id: `AUD-${String(prev.length + 1).padStart(2, '0')}`,
        timestamp: formatAdminDateTime(now),
        action: 'Gán vai trò',
        target: `${payload.userName} (${payload.userCode})`,
        detail: `${payload.role} · ${payload.lotName}${payload.gateName !== '—' ? ` (${payload.gateName})` : ''} · ${payload.validUntil}`,
        actor: 'Quản trị CNTT',
      },
      ...prev,
    ])
  }

  function handleRevokeRole(assignmentId: string, reason: string) {
    const target = assignments.find(item => item.id === assignmentId)
    if (!target) return
    setAssignments(prev => prev.map(item => (
      item.id === assignmentId ? { ...item, status: 'Đã thu hồi' } : item
    )))
    setRoleAuditLogs(prev => [
      {
        id: `AUD-${String(prev.length + 1).padStart(2, '0')}`,
        timestamp: formatAdminDateTime(new Date()),
        action: 'Thu hồi vai trò',
        target: `${target.userName} (${target.userCode})`,
        detail: `${target.role} · Lý do: ${reason}`,
        actor: 'Quản trị CNTT',
      },
      ...prev,
    ])
  }

  function handleToggleMatrixCell(permissionKey: string, role: typeof assignments[number]['role']) {
    const targetRow = matrix.find(row => row.key === permissionKey)
    if (!targetRow) return
    const nextValue = !targetRow.roles[role]
    setMatrix(prev => prev.map(row => (
      row.key === permissionKey
        ? { ...row, roles: { ...row.roles, [role]: nextValue } }
        : row
    )))
    setRoleAuditLogs(prev => [
      {
        id: `AUD-${String(prev.length + 1).padStart(2, '0')}`,
        timestamp: formatAdminDateTime(new Date()),
        action: 'Cập nhật ma trận',
        target: role,
        detail: `${nextValue ? 'Bật' : 'Tắt'} quyền "${targetRow.label}"`,
        actor: 'Quản trị CNTT',
      },
      ...prev,
    ])
  }

  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi-VN')
  const filteredRows = (current?.rows ?? []).filter(vehicle =>
    !normalizedKeyword ||
    [vehicle.licensePlate, vehicle.ownerName, vehicle.ownerCode].some(value =>
      value.toLocaleLowerCase('vi-VN').includes(normalizedKeyword),
    ),
  )
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-5">
      <PageHeader title="Duyệt & Quản lý Phương tiện" description="Xem hồ sơ đăng ký, quản lý người dùng từ SSO và phân quyền vận hành." />
      <nav aria-label="Quản lý phương tiện" className="flex flex-wrap gap-2">
        {tabs.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={tab === value} className={tab === value ? primary : button} onClick={() => {
            setNotice('')
            setPage(1)
            updateSearch({ tab: value })
          }}>{label}</button>
        ))}
      </nav>
      {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">{notice}</p>}
      {live ? (
        <>
          <div className={`grid min-w-0 gap-2 ${tab === 'vehicles' ? 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''}`}>
            <input
              type="search"
              aria-label="Biển số, tên hoặc mã chủ xe"
              placeholder="Tìm biển số, tên hoặc mã chủ xe"
              className={field}
              value={keyword}
              onChange={event => {
                setKeyword(event.target.value)
                setPage(1)
              }}
            />
            {tab === 'vehicles' && (
              <select
                aria-label="Trạng thái hồ sơ"
                className={field}
                value={status}
                onChange={event => {
                  setPage(1)
                  updateSearch({ tab, status: event.target.value })
                }}
              >
                <option value="">Mọi trạng thái</option>
                {Object.entries(statuses).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            )}
          </div>
          {!current && <p role="status">Đang tải hồ sơ…</p>}
          {current?.error && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4" role="alert">
              <p>{current.error}</p><button type="button" className={button} onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
            </div>
          )}
          {current?.rows && (!filteredRows.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-semibold">Không có hồ sơ phù hợp</h2>
              {(keyword || (tab === 'vehicles' && status)) && (
                <button
                  type="button"
                  className={`${button} mt-3`}
                  onClick={() => {
                    setKeyword('')
                    setPage(1)
                    if (tab === 'vehicles') updateSearch({ tab })
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr>
                    {['Biển số', 'Chủ xe', 'Phương tiện', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}
                  </tr></thead>
                  <tbody>
                    {pagedRows.map(vehicle => (
                      <tr key={vehicle.id} className="border-t border-slate-100">
                        <th scope="row" className="p-3 font-semibold">{vehicle.licensePlate}</th>
                        <td className="p-3">{vehicle.ownerName}<span className="block text-xs text-slate-500">{vehicle.ownerCode}</span></td>
                        <td className="p-3">{[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || vehicleTypeLabel(vehicle.vehicleType)}</td>
                        <td className="p-3"><AdminStatusBadge status={vehicle.status} /></td>
                        <td className="p-3"><button type="button" className={button} aria-label={`Xem hồ sơ ${vehicle.licensePlate}`} onClick={() => {
                          setNotice('')
                          setSelected(vehicle.id)
                        }}>Chi tiết</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={filteredRows.length}
                itemLabel="hồ sơ"
                onPageChange={setPage}
                onPageSizeChange={size => {
                  setPageSize(size)
                  setPage(1)
                }}
              />
            </div>
          ))}
        </>
      ) : tab === 'users' ? (
        <AdminUsersTab
          users={mergedUsers}
          syncLogs={syncLogs}
          vehicles={current?.rows ?? []}
          sessions={sessionHistory.status === 'ready' ? sessionHistory.data : []}
          vehiclesLoaded={Boolean(current?.rows)}
          onSyncNow={handleSyncNow}
          onToggleParkingLock={handleToggleParkingLock}
        />
      ) : (
        <AdminPermissionsTab
          ssoUsers={mergedUsers}
          lots={lotReference.status === 'ready' ? lotReference.data : []}
          assignments={assignments}
          matrix={matrix}
          auditLogs={roleAuditLogs}
          onAssignRole={handleAssignRole}
          onRevokeRole={handleRevokeRole}
          onToggleMatrixCell={handleToggleMatrixCell}
        />
      )}
      {selected !== undefined && (
        <VehicleDrawer id={selected} onClose={() => setSelected(undefined)} onReviewed={vehicle => {
          setNotice(`${vehicle.licensePlate} · ${statuses[vehicle.status]}`)
          setAttempt(value => value + 1)
        }} />
      )}
    </div>
  )
}

function VehicleDocument({ url, label }: { url: string | null; label: string }) {
  const internal = url && /^\/api\/v1\/vehicles\/documents\/\d+$/.test(url)
  const external = url && /^https?:\/\//i.test(url) ? url : null
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ attempt: number; src?: string; error?: string }>()
  const [failed, setFailed] = useState(false)
  const current = result?.attempt === attempt ? result : undefined
  useEffect(() => {
    if (!internal || !url) return
    const controller = new AbortController()
    let objectUrl: string | undefined
    apiGetBlob(url, controller.signal).then(blob => {
      if (controller.signal.aborted) return
      if (!['image/jpeg', 'image/png'].includes(blob.type)) throw new Error('Tệp ảnh không được hỗ trợ.')
      objectUrl = URL.createObjectURL(blob)
      setResult({ attempt, src: objectUrl })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ attempt, error: adminErrorMessage(error) })
    })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, internal, attempt])
  const src = internal ? current?.src : external && /\.(?:png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(external) ? external : undefined
  const openUrl = internal ? current?.src : external
  return (
    <section aria-label={label} className="space-y-2 rounded-xl border border-slate-200 p-3">
      <h3 className="text-sm font-semibold">{label}</h3>
      {src && !failed && (
        <img src={src} alt={label} referrerPolicy="no-referrer" onError={() => setFailed(true)}
          className="max-h-72 w-full rounded-lg bg-slate-50 object-contain" />
      )}
      {internal && !current && <p role="status" className="text-sm text-slate-600">Đang tải ảnh…</p>}
      {current?.error && <div role="alert" className="text-sm text-red-700">{current.error} <button type="button" className="underline" onClick={() => { setFailed(false); setAttempt(n => n + 1) }}>Thử lại</button></div>}
      {!internal && !external && <p className="text-sm text-slate-600">Chưa có ảnh đính kèm.</p>}
      {failed && <p className="text-sm text-slate-600">Không thể hiển thị ảnh xem trước.</p>}
      {openUrl && <a href={openUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Mở ảnh trong tab mới</a>}
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
    <dialog
      ref={dialog}
      aria-labelledby="vehicle-title"
      onClick={event => {
        if (event.target === dialog.current && !working) onClose()
      }}
      onCancel={event => {
        event.preventDefault()
        if (!working) onClose()
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-lg overflow-y-auto bg-[#faf8ff] text-slate-950 shadow-xl backdrop:bg-slate-950/40"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Chi tiết hồ sơ</p>
          <h2 id="vehicle-title" className="mt-1 text-xl font-bold">Hồ sơ {vehicle?.licensePlate ?? 'phương tiện'}</h2>
        </div>
        <button className={button} type="button" onClick={onClose} disabled={working}>Đóng</button>
      </header>
      <div className="p-5">
        {!vehicle && !error && <p role="status">Đang tải hồ sơ…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {vehicle && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <dl className="space-y-3 text-sm">
              {[['Chủ xe', vehicle.ownerName], ['Mã chủ xe', vehicle.ownerCode], ['Email', vehicle.ownerEmail],
                ['Loại xe', vehicleTypeLabel(vehicle.vehicleType)], ['Nhãn hiệu', vehicle.brand], ['Mẫu xe', vehicle.model],
                ['Màu', vehicle.color], ['Lý do từ chối', vehicle.rejectionReason],
                ['Người xử lý', vehicle.reviewerName], ['Thời điểm xử lý', vehicle.reviewedAt && formatAdminDateTime(vehicle.reviewedAt)]].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_2fr] gap-2"><dt className="text-slate-600">{label}</dt><dd className="break-words font-medium">{value}</dd></div>
              ))}
              <div className="grid grid-cols-[1fr_2fr] gap-2"><dt className="text-slate-600">Trạng thái</dt><dd><AdminStatusBadge status={vehicle.status} /></dd></div>
            </dl>
            <VehicleDocument key={`front-${vehicle.registrationDocUrl}`} label="Mặt trước giấy đăng ký xe" url={vehicle.registrationDocUrl} />
            <VehicleDocument key={`back-${vehicle.registrationDocBackUrl}`} label="Mặt sau giấy đăng ký xe" url={vehicle.registrationDocBackUrl} />
            {vehicle.vehiclePhotoUrl && <VehicleDocument key={`photo-${vehicle.vehiclePhotoUrl}`} label="Ảnh thực tế phương tiện" url={vehicle.vehiclePhotoUrl} />}
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
      </div>
    </dialog>
  )
}
