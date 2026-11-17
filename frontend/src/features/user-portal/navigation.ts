import type { IconName } from '../../shared/components/Icon'

export const userPortalNavigation: {
  path: string
  title: string
  description: string
  icon: IconName
}[] = [
  {
    path: 'overview',
    title: 'Dashboard',
    description: 'Tổng quan hoạt động gửi xe của bạn.',
    icon: 'dashboard',
  },
  {
    path: 'vehicles',
    title: 'Quản lý phương tiện',
    description: 'Đăng ký và theo dõi các phương tiện của bạn.',
    icon: 'vehicles',
  },
  {
    path: 'reservations',
    title: 'Đặt chỗ trước',
    description: 'Theo dõi các lượt đặt chỗ tại bãi xe.',
    icon: 'reservation',
  },
  {
    path: 'packages',
    title: 'Gói đỗ xe & Thanh toán',
    description: 'Quản lý gói đỗ xe và thông tin thanh toán.',
    icon: 'packages',
  },
  {
    path: 'activity',
    title: 'Lịch sử hoạt động',
    description: 'Xem lại các lượt gửi xe và hoạt động gần đây.',
    icon: 'history',
  },
  {
    path: 'settings',
    title: 'Cài đặt hệ thống',
    description: 'Quản lý tài khoản và tùy chọn sử dụng.',
    icon: 'settings',
  },
]

export const userPortalUtilityPages = [
  {
    path: 'notifications',
    title: 'Thông báo',
    description: 'Cập nhật về xe, gói đỗ, đặt chỗ và yêu cầu hỗ trợ của bạn.',
  },
] as const
