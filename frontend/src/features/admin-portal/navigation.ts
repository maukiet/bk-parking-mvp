import type { IconName } from '../../shared/components/Icon'

export const adminNavigation = [
  { path: 'overview', title: 'Bảng điều khiển', icon: 'dashboard' },
  { path: 'parking-lots', title: 'Quản lý Bãi đỗ', icon: 'vehicles' },
  { path: 'vehicles', title: 'Duyệt & Quản lý Phương tiện', icon: 'vehicles' },
  { path: 'reservations', title: 'Quản lý Đặt chỗ', icon: 'reservation' },
  { path: 'payments', title: 'Gói giữ xe & Đối soát', icon: 'packages' },
  { path: 'reports', title: 'Báo cáo & Thống kê', icon: 'history' },
] satisfies { path: string; title: string; icon: IconName }[]
