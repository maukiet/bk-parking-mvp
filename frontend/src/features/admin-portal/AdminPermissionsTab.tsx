import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import type { ParkingLotDto } from '../../types/api'
import { AdminConfirmation } from './AdminConfirmation'
import { AdminPagination } from './AdminPagination'
import { AdminStatusBadge } from './AdminStatusBadge'
import {
  OPERATIONAL_ROLES,
  type OperationalRole,
  type PermissionMatrixRow,
  type RoleAssignmentRecord,
  type RoleAuditLog,
  type SsoUserRecord,
} from './adminUsersRbacData'

const field = 'min-h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
const button = 'min-h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50'
const primary = 'min-h-11 whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

const DEFAULT_GATES = ['Tất cả cổng', 'Cổng A1 - Làn 1', 'Cổng A1 - Làn 2', 'Cổng Nội bộ B4', 'Cổng chính']

interface AdminPermissionsTabProps {
  ssoUsers: SsoUserRecord[]
  lots: ParkingLotDto[]
  assignments: RoleAssignmentRecord[]
  matrix: PermissionMatrixRow[]
  auditLogs: RoleAuditLog[]
  onAssignRole: (payload: {
    userCode: string
    userName: string
    role: OperationalRole
    lotName: string
    gateName: string
    validUntil: string
  }) => void
  onRevokeRole: (assignmentId: string, reason: string) => void
  onToggleMatrixCell: (permissionKey: string, role: OperationalRole) => void
}

export function AdminPermissionsTab({
  ssoUsers,
  lots,
  assignments,
  matrix,
  auditLogs,
  onAssignRole,
  onRevokeRole,
  onToggleMatrixCell,
}: AdminPermissionsTabProps) {
  const { user } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [assignOpen, setAssignOpen] = useState(false)
  const [revokingTarget, setRevokingTarget] = useState<RoleAssignmentRecord | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [notice, setNotice] = useState('')

  const canEditMatrix = !user || user.role === 'ROLE_ADMIN'
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi-VN')
  const filtered = assignments.filter(item =>
    (!roleFilter || item.role === roleFilter) &&
    (!statusFilter || item.status === statusFilter) &&
    (!normalizedKeyword || [item.userName, item.userCode, item.lotName, item.gateName].some(value =>
      value.toLocaleLowerCase('vi-VN').includes(normalizedKeyword),
    )),
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedAssignments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div>
          <h2 className="font-bold">Tài khoản vận hành &amp; phân quyền</h2>
          <p className="mt-1 text-xs text-slate-500">
            Chỉ gán vai trò cho nhân sự đã đồng bộ từ SSO. Không tạo tài khoản thủ công.
          </p>
        </div>
        <button
          type="button"
          className={primary}
          onClick={() => {
            setNotice('')
            setAssignOpen(true)
          }}
        >
          Gán vai trò
        </button>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>
      )}

      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <input
          type="search"
          aria-label="Tìm theo tên, mã cán bộ hoặc bãi phụ trách"
          placeholder="Tìm theo tên, mã cán bộ hoặc bãi phụ trách"
          className={field}
          value={keyword}
          onChange={event => {
            setKeyword(event.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Lọc theo vai trò"
          className={field}
          value={roleFilter}
          onChange={event => {
            setRoleFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả vai trò</option>
          {OPERATIONAL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <select
          aria-label="Lọc theo trạng thái hiệu lực"
          className={field}
          value={statusFilter}
          onChange={event => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Mọi trạng thái</option>
          <option value="Đang hiệu lực">Đang hiệu lực</option>
          <option value="Đã thu hồi">Đã thu hồi</option>
        </select>
      </div>

      {!filtered.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="font-semibold">Không có phân công phù hợp</h3>
          {(keyword || roleFilter || statusFilter) && (
            <button
              type="button"
              className={`${button} mt-3`}
              onClick={() => {
                setKeyword('')
                setRoleFilter('')
                setStatusFilter('')
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
                  {['Người', 'Vai trò', 'Bãi & cổng phụ trách', 'Trạng thái', 'Ngày gán', 'Thao tác'].map(label => (
                    <th key={label} scope="col" className="p-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedAssignments.map(item => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <th scope="row" className="p-3 font-semibold">
                      {item.userName}
                      <span className="block text-xs font-normal text-slate-500">{item.userCode}</span>
                    </th>
                    <td className="p-3 font-medium">{item.role}</td>
                    <td className="p-3">
                      {item.lotName}
                      {item.gateName !== '—' && <span className="block text-xs text-slate-500">{item.gateName}</span>}
                    </td>
                    <td className="p-3"><AdminStatusBadge status={item.status} /></td>
                    <td className="p-3 tabular-nums">
                      {item.assignedAt}
                      <span className="block text-xs text-slate-500">Hiệu lực: {item.validUntil}</span>
                    </td>
                    <td className="p-3">
                      {item.status === 'Đang hiệu lực' ? (
                        <button
                          type="button"
                          className={button}
                          onClick={() => {
                            setRevokingTarget(item)
                            setRevokeReason('')
                          }}
                        >
                          Thu hồi
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Đã thu hồi</span>
                      )}
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
            itemLabel="phân công"
            onPageChange={setPage}
            onPageSizeChange={size => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}

      {revokingTarget && (
        <section className="rounded-2xl border border-amber-200 bg-white p-5" aria-label="Thu hồi vai trò">
          <div className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="revoke-reason">
              Lý do thu hồi vai trò của {revokingTarget.userName} ({revokingTarget.role})
            </label>
            <input
              id="revoke-reason"
              type="text"
              className={field}
              value={revokeReason}
              onChange={event => setRevokeReason(event.target.value)}
              placeholder="Ví dụ: Điều chuyển ca trực / kết thúc nhiệm kỳ"
            />
            <AdminConfirmation
              title="Xác nhận thu hồi vai trò"
              confirmLabel="Thu hồi vai trò"
              busy={false}
              onCancel={() => setRevokingTarget(null)}
              onConfirm={() => {
                onRevokeRole(revokingTarget.id, revokeReason.trim() || 'Thu hồi theo yêu cầu quản trị')
                setNotice(`Đã thu hồi vai trò ${revokingTarget.role} của ${revokingTarget.userName}.`)
                setRevokingTarget(null)
              }}
            >
              Người dùng <strong>{revokingTarget.userName}</strong> sẽ mất quyền <strong>{revokingTarget.role}</strong> ngay lập tức.
            </AdminConfirmation>
          </div>
        </section>
      )}

      <section aria-labelledby="matrix-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h3 id="matrix-heading" className="font-bold">Ma trận quyền theo vai trò</h3>
          <p className="mt-1 text-xs text-slate-500">Chỉ Quản trị CNTT được chỉnh sửa ma trận quyền.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="p-3">Quyền nghiệp vụ</th>
                {OPERATIONAL_ROLES.map(role => (
                  <th key={role} scope="col" className="p-3 text-center">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map(row => (
                <tr key={row.key} className="border-t border-slate-100">
                  <th scope="row" className="p-3 font-medium text-slate-900">{row.label}</th>
                  {OPERATIONAL_ROLES.map(role => {
                    const checked = row.roles[role]
                    const lockedSelfAdmin = row.key === 'rbac_manage' && role === 'Quản trị CNTT'
                    return (
                      <td key={role} className="p-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${row.label} – ${role}`}
                          checked={checked}
                          disabled={!canEditMatrix || lockedSelfAdmin}
                          onChange={() => onToggleMatrixCell(row.key, role)}
                          className="size-4 accent-black disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="role-audit-heading" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 id="role-audit-heading" className="font-bold">Lịch sử gán và thu hồi vai trò</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="p-2.5">Thời điểm</th>
                <th scope="col" className="p-2.5">Thao tác</th>
                <th scope="col" className="p-2.5">Đối tượng</th>
                <th scope="col" className="p-2.5">Chi tiết</th>
                <th scope="col" className="p-2.5">Người thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="p-2.5 tabular-nums">{log.timestamp}</td>
                  <th scope="row" className="p-2.5 font-semibold">{log.action}</th>
                  <td className="p-2.5">{log.target}</td>
                  <td className="p-2.5 text-slate-600">{log.detail}</td>
                  <td className="p-2.5">{log.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {assignOpen && (
        <AssignRoleDrawer
          ssoUsers={ssoUsers}
          lots={lots}
          onClose={() => setAssignOpen(false)}
          onSubmit={payload => {
            onAssignRole(payload)
            setNotice(`Đã gán vai trò ${payload.role} cho ${payload.userName}.`)
            setAssignOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AssignRoleDrawer({
  ssoUsers,
  lots,
  onClose,
  onSubmit,
}: {
  ssoUsers: SsoUserRecord[]
  lots: ParkingLotDto[]
  onClose: () => void
  onSubmit: (payload: {
    userCode: string
    userName: string
    role: OperationalRole
    lotName: string
    gateName: string
    validUntil: string
  }) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedCode, setSelectedCode] = useState('')
  const [role, setRole] = useState<OperationalRole>('Bảo vệ')
  const [lotName, setLotName] = useState(() => lots[0]?.name ?? 'Bãi A (Cơ sở Lý Thường Kiệt)')
  const [gateName, setGateName] = useState('Cổng chính')
  const [validMode, setValidMode] = useState<'unlimited' | 'until'>('unlimited')
  const [validDate, setValidDate] = useState('2027-08-31')
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  const isGuardRole = role === 'Bảo vệ' || role === 'Bảo vệ trưởng'
  const lotOptions = lots.length > 0
    ? [...lots.map(lot => lot.name), 'Tất cả bãi Cơ sở 1']
    : ['Nhà xe Khu A1 (Cổng Lý Thường Kiệt)', 'Nhà xe Sinh viên B1 (Cổng Tô Hiến Thành)', 'Nhà xe Cán bộ & Giảng viên B4', 'Tất cả bãi Cơ sở 1']

  const activeUsers = ssoUsers.filter(user => user.status === 'Hoạt động')
  const q = userSearch.trim().toLocaleLowerCase('vi-VN')
  const matchingUsers = activeUsers.filter(user =>
    !q || [user.code, user.fullName, user.department].some(value =>
      value.toLocaleLowerCase('vi-VN').includes(q),
    ),
  )
  const pickedUser = activeUsers.find(user => user.code === selectedCode) ?? null

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!pickedUser) {
      setError('Vui lòng chọn một nhân sự đã đồng bộ từ SSO.')
      return
    }
    if (validMode === 'until' && !validDate) {
      setError('Vui lòng chọn ngày hết hiệu lực.')
      return
    }
    onSubmit({
      userCode: pickedUser.code,
      userName: pickedUser.fullName,
      role,
      lotName: isGuardRole ? lotName : 'Toàn hệ thống',
      gateName: isGuardRole ? gateName : '—',
      validUntil: validMode === 'unlimited' ? 'Không thời hạn' : validDate.split('-').reverse().join('/'),
    })
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="assign-role-title"
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
          <p className="text-xs font-semibold uppercase text-slate-500">Phân quyền vận hành</p>
          <h2 id="assign-role-title" className="mt-1 text-xl font-bold">Gán vai trò</h2>
        </div>
        <button type="button" className={button} onClick={onClose}>Đóng</button>
      </header>

      <form className="space-y-4 p-5" onSubmit={handleSave}>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium">
            Tìm người trong danh sách đã đồng bộ từ SSO
            <input
              type="search"
              placeholder="Tìm mã cán bộ, họ tên hoặc đơn vị"
              value={userSearch}
              onChange={event => setUserSearch(event.target.value)}
              className={`${field} mt-1`}
            />
          </label>

          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {matchingUsers.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">Không tìm thấy nhân sự đang hoạt động trong danh sách SSO.</p>
            ) : (
              matchingUsers.map(user => (
                <button
                  key={user.code}
                  type="button"
                  onClick={() => {
                    setSelectedCode(user.code)
                    setError('')
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm ${
                    selectedCode === user.code ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>
                    <strong className="block">{user.fullName}</strong>
                    <span className={`text-xs ${selectedCode === user.code ? 'text-slate-300' : 'text-slate-500'}`}>
                      {user.code} · {user.department}
                    </span>
                  </span>
                  <span className={`text-xs font-semibold ${selectedCode === user.code ? 'text-lime-400' : 'text-slate-500'}`}>
                    {user.group}
                  </span>
                </button>
              ))
            )}
          </div>

          <label className="block text-sm font-medium">
            Vai trò
            <select
              value={role}
              onChange={event => setRole(event.target.value as OperationalRole)}
              className={`${field} mt-1`}
            >
              {OPERATIONAL_ROLES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          {isGuardRole && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Bãi phụ trách
                <select value={lotName} onChange={event => setLotName(event.target.value)} className={`${field} mt-1`}>
                  {lotOptions.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Cổng phụ trách
                <select value={gateName} onChange={event => setGateName(event.target.value)} className={`${field} mt-1`}>
                  {DEFAULT_GATES.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="space-y-2">
            <span className="block text-sm font-medium">Hiệu lực</span>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="validMode"
                  checked={validMode === 'unlimited'}
                  onChange={() => setValidMode('unlimited')}
                />
                Không thời hạn
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="validMode"
                  checked={validMode === 'until'}
                  onChange={() => setValidMode('until')}
                />
                Đến ngày
              </label>
            </div>
            {validMode === 'until' && (
              <input
                type="date"
                aria-label="Ngày hết hiệu lực"
                value={validDate}
                onChange={event => setValidDate(event.target.value)}
                className={field}
                required
              />
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className={button} onClick={onClose}>Hủy</button>
          <button type="submit" className={primary}>Xác nhận gán vai trò</button>
        </div>
      </form>
    </dialog>
  )
}
