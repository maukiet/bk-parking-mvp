import type { AdminVehicleDto } from '../../types/api'

export type SsoUserGroup = 'Sinh viên' | 'Giảng viên' | 'Nhân viên'
export type SsoUserStatus = 'Hoạt động' | 'Bị khóa' | 'Hết hiệu lực'

export interface SsoUserRecord {
  code: string
  fullName: string
  email: string
  department: string
  group: SsoUserGroup
  status: SsoUserStatus
  lockReason?: string
  vehicleCount: number
  packageName: string
  sampleVehicles: { licensePlate: string; type: string; status: string }[]
  samplePackages: { name: string; period: string; status: string }[]
  sampleSessions: { lot: string; gate: string; time: string; action: string }[]
  sampleTickets: { code: string; subject: string; createdAt: string; status: string }[]
}

export interface DirectoryAccountItem {
  username: string
  fullName: string
  code: string
  role: string
  roleName: string
}

export interface SsoSyncLog {
  id: string
  syncedAt: string
  trigger: string
  totalRecords: number
  updatedRecords: number
  status: 'Thành công'
}

export type OperationalRole =
  | 'Bảo vệ'
  | 'Bảo vệ trưởng'
  | 'Cán bộ CSVC'
  | 'Lãnh đạo'
  | 'Tài chính'
  | 'Quản trị CNTT'

export type RoleAssignmentStatus = 'Đang hiệu lực' | 'Đã thu hồi'

export interface RoleAssignmentRecord {
  id: string
  userCode: string
  userName: string
  role: OperationalRole
  lotName: string
  gateName: string
  status: RoleAssignmentStatus
  assignedAt: string
  validUntil: string
}

export interface RoleAuditLog {
  id: string
  timestamp: string
  action: 'Gán vai trò' | 'Thu hồi vai trò' | 'Cập nhật ma trận'
  target: string
  detail: string
  actor: string
}

export interface PermissionMatrixRow {
  key: string
  label: string
  roles: Record<OperationalRole, boolean>
}

export const OPERATIONAL_ROLES: OperationalRole[] = [
  'Bảo vệ',
  'Bảo vệ trưởng',
  'Cán bộ CSVC',
  'Lãnh đạo',
  'Tài chính',
  'Quản trị CNTT',
]

export const INITIAL_SSO_USERS: SsoUserRecord[] = [
  {
    code: '2311770',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen2311770@hcmut.edu.vn',
    department: 'Khoa KH & KT Máy tính',
    group: 'Sinh viên',
    status: 'Hoạt động',
    vehicleCount: 2,
    packageName: 'Gói Học kỳ HK261 (Sinh viên)',
    sampleVehicles: [
      { licensePlate: '59X3-682.45', type: 'Honda AirBlade 125', status: 'APPROVED' },
      { licensePlate: '59T2-119.88', type: 'Yamaha Grande', status: 'PENDING' },
    ],
    samplePackages: [
      { name: 'Gói Học kỳ HK261 (Sinh viên)', period: '01/09/2026 – 31/12/2026', status: 'Hoạt động' },
    ],
    sampleSessions: [
      { lot: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)', gate: 'Cổng A1 - Làn 1 → Cổng A1 - Làn 2', time: '11/11/2026 07:30', action: 'Đã hoàn tất' },
    ],
    sampleTickets: [],
  },
  {
    code: '2210456',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran2210456@hcmut.edu.vn',
    department: 'Khoa Điện - Điện tử',
    group: 'Sinh viên',
    status: 'Hoạt động',
    vehicleCount: 2,
    packageName: 'Gói Học kỳ HK261 (Sinh viên)',
    sampleVehicles: [
      { licensePlate: '60B8-451.20', type: 'Honda Vision', status: 'APPROVED' },
      { licensePlate: '72C1-990.12', type: 'Suzuki Raider', status: 'REJECTED' },
    ],
    samplePackages: [
      { name: 'Gói Học kỳ HK261 (Sinh viên)', period: '01/09/2026 – 31/12/2026', status: 'Hoạt động' },
    ],
    sampleSessions: [
      { lot: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)', gate: 'Cổng A1 - Làn 1', time: '12/11/2026 07:45', action: 'Đang gửi' },
    ],
    sampleTickets: [
      { code: 'TK-072', subject: 'Bổ sung ảnh giấy đăng ký xe 72C1-990.12', createdAt: '11/11/2026', status: 'Đang xử lý' },
    ],
  },
  {
    code: 'CB00891',
    fullName: 'TS. Lê Hoàng Nam',
    email: 'nam.le@hcmut.edu.vn',
    department: 'Khoa Cơ khí',
    group: 'Giảng viên',
    status: 'Hoạt động',
    vehicleCount: 1,
    packageName: 'Gói Tháng Tiêu chuẩn',
    sampleVehicles: [
      { licensePlate: '51A-888.99', type: 'VinFast Evo200', status: 'APPROVED' },
    ],
    samplePackages: [
      { name: 'Gói Tháng Tiêu chuẩn', period: '01/11/2026 – 30/11/2026', status: 'Hoạt động' },
    ],
    sampleSessions: [
      { lot: 'Nhà xe Cán bộ & Giảng viên B4', gate: 'Cổng Nội bộ B4', time: '12/11/2026 08:15', action: 'Đang gửi' },
    ],
    sampleTickets: [],
  },
  {
    code: 'ADM001',
    fullName: 'Phạm Quản Trị',
    email: 'admin.parking@hcmut.edu.vn',
    department: 'Phòng Quản trị Thiết bị',
    group: 'Nhân viên',
    status: 'Hoạt động',
    vehicleCount: 0,
    packageName: 'Chưa đăng ký',
    sampleVehicles: [],
    samplePackages: [],
    sampleSessions: [],
    sampleTickets: [],
  },
  {
    code: 'STF001',
    fullName: 'Võ Văn Bảo Vệ',
    email: 'staff.gate1@hcmut.edu.vn',
    department: 'Đội Bảo vệ Cơ sở 1',
    group: 'Nhân viên',
    status: 'Hoạt động',
    vehicleCount: 0,
    packageName: 'Miễn phí nội bộ',
    sampleVehicles: [],
    samplePackages: [],
    sampleSessions: [],
    sampleTickets: [],
  },
]

function inferUserGroup(code: string, role?: string): SsoUserGroup {
  if (role === 'ROLE_ADMIN' || role === 'ROLE_STAFF') return 'Nhân viên'
  const upper = code.toUpperCase()
  if (upper.startsWith('CB') || upper.startsWith('GV')) return 'Giảng viên'
  if (upper.startsWith('NV') || upper.startsWith('ADM') || upper.startsWith('STF')) return 'Nhân viên'
  return 'Sinh viên'
}

export function mergeDirectoryUsers(
  baseUsers: SsoUserRecord[],
  vehicles: AdminVehicleDto[],
  accounts: DirectoryAccountItem[],
): SsoUserRecord[] {
  const map = new Map<string, SsoUserRecord>()
  for (const user of baseUsers) {
    map.set(user.code.toLowerCase(), user)
  }

  for (const account of accounts) {
    const key = account.code.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      map.set(key, {
        ...existing,
        fullName: account.fullName || existing.fullName,
      })
    } else {
      map.set(key, {
        code: account.code,
        fullName: account.fullName,
        email: `${account.username}@hcmut.edu.vn`,
        department: account.roleName || 'Hồ sơ SSO Trường',
        group: inferUserGroup(account.code, account.role),
        status: 'Hoạt động',
        vehicleCount: 0,
        packageName: 'Chưa đăng ký',
        sampleVehicles: [],
        samplePackages: [],
        sampleSessions: [],
        sampleTickets: [],
      })
    }
  }

  for (const vehicle of vehicles) {
    const key = vehicle.ownerCode.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      map.set(key, {
        ...existing,
        fullName: vehicle.ownerName || existing.fullName,
        email: vehicle.ownerEmail || existing.email,
      })
    } else {
      map.set(key, {
        code: vehicle.ownerCode,
        fullName: vehicle.ownerName,
        email: vehicle.ownerEmail,
        department: 'Hồ sơ SSO Trường',
        group: inferUserGroup(vehicle.ownerCode),
        status: 'Hoạt động',
        vehicleCount: 0,
        packageName: 'Chưa đăng ký',
        sampleVehicles: [],
        samplePackages: [],
        sampleSessions: [],
        sampleTickets: [],
      })
    }
  }

  return Array.from(map.values())
}

export const INITIAL_SYNC_LOGS: SsoSyncLog[] = [
  {
    id: 'SYNC-03',
    syncedAt: '26/11/2026 06:00:04',
    trigger: 'Lịch tự động (06:00)',
    totalRecords: 5,
    updatedRecords: 2,
    status: 'Thành công',
  },
  {
    id: 'SYNC-02',
    syncedAt: '25/11/2026 06:00:02',
    trigger: 'Lịch tự động (06:00)',
    totalRecords: 5,
    updatedRecords: 1,
    status: 'Thành công',
  },
  {
    id: 'SYNC-01',
    syncedAt: '24/11/2026 06:00:05',
    trigger: 'Lịch tự động (06:00)',
    totalRecords: 5,
    updatedRecords: 5,
    status: 'Thành công',
  },
]

export const INITIAL_ROLE_ASSIGNMENTS: RoleAssignmentRecord[] = [
  {
    id: 'RA-01',
    userCode: 'STF001',
    userName: 'Võ Văn Bảo Vệ',
    role: 'Bảo vệ',
    lotName: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)',
    gateName: 'Cổng A1 - Làn 1',
    status: 'Đang hiệu lực',
    assignedAt: '01/09/2026',
    validUntil: '31/08/2027',
  },
  {
    id: 'RA-02',
    userCode: 'ADM001',
    userName: 'Phạm Quản Trị',
    role: 'Quản trị CNTT',
    lotName: 'Toàn hệ thống',
    gateName: '—',
    status: 'Đang hiệu lực',
    assignedAt: '01/09/2026',
    validUntil: 'Không thời hạn',
  },
  {
    id: 'RA-03',
    userCode: 'CB00891',
    userName: 'TS. Lê Hoàng Nam',
    role: 'Lãnh đạo',
    lotName: 'Toàn hệ thống',
    gateName: '—',
    status: 'Đang hiệu lực',
    assignedAt: '15/09/2026',
    validUntil: 'Không thời hạn',
  },
]

export const INITIAL_ROLE_AUDIT_LOGS: RoleAuditLog[] = [
  {
    id: 'AUD-03',
    timestamp: '15/09/2026 09:00',
    action: 'Gán vai trò',
    target: 'TS. Lê Hoàng Nam (CB00891)',
    detail: 'Lãnh đạo · Toàn hệ thống · Không thời hạn',
    actor: 'Phạm Quản Trị (ADM001)',
  },
  {
    id: 'AUD-02',
    timestamp: '01/09/2026 08:45',
    action: 'Gán vai trò',
    target: 'Phạm Quản Trị (ADM001)',
    detail: 'Quản trị CNTT · Toàn hệ thống · Không thời hạn',
    actor: 'Hệ thống',
  },
  {
    id: 'AUD-01',
    timestamp: '01/09/2026 08:30',
    action: 'Gán vai trò',
    target: 'Võ Văn Bảo Vệ (STF001)',
    detail: 'Bảo vệ · Nhà xe Khu A1 (Cổng Lý Thường Kiệt) (Cổng A1 - Làn 1)',
    actor: 'Phạm Quản Trị (ADM001)',
  },
]

export const INITIAL_PERMISSION_MATRIX: PermissionMatrixRow[] = [
  {
    key: 'gate_control',
    label: 'Kiểm soát lượt vào/ra & quét QR tại cổng',
    roles: {
      'Bảo vệ': true,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': false,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': false,
    },
  },
  {
    key: 'exception_handle',
    label: 'Xử lý ngoại lệ & sự cố bãi xe',
    roles: {
      'Bảo vệ': true,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': true,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': false,
    },
  },
  {
    key: 'vehicle_review',
    label: 'Duyệt / từ chối hồ sơ đăng ký phương tiện',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': true,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': true,
    },
  },
  {
    key: 'lot_config',
    label: 'Quản lý bãi đỗ & điều chỉnh sức chứa',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': true,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': true,
    },
  },
  {
    key: 'user_lock',
    label: 'Khóa / mở khóa quyền gửi xe của người dùng',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': true,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': true,
    },
  },
  {
    key: 'finance_report',
    label: 'Đối soát giao dịch gói & xuất báo cáo doanh thu',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': false,
      'Cán bộ CSVC': false,
      'Lãnh đạo': true,
      'Tài chính': true,
      'Quản trị CNTT': false,
    },
  },
  {
    key: 'dashboard_view',
    label: 'Xem dashboard điều hành & thống kê lưu lượng',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': true,
      'Cán bộ CSVC': true,
      'Lãnh đạo': true,
      'Tài chính': true,
      'Quản trị CNTT': true,
    },
  },
  {
    key: 'rbac_manage',
    label: 'Gán vai trò & chỉnh sửa ma trận phân quyền',
    roles: {
      'Bảo vệ': false,
      'Bảo vệ trưởng': false,
      'Cán bộ CSVC': false,
      'Lãnh đạo': false,
      'Tài chính': false,
      'Quản trị CNTT': true,
    },
  },
]
