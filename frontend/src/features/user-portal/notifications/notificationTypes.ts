export type NotificationCategory = 'session' | 'vehicle' | 'package' | 'support' | 'system'
export type NotificationLevel = 'action' | 'important' | 'info' | 'success'

export interface UserNotification {
  id: string
  category: NotificationCategory
  level: NotificationLevel
  title: string
  message: string
  createdAt: string
  read: boolean
  pinned: boolean
  vehicleLabel?: string
  actionLabel?: string
  actionHref?: string
}

export interface NotificationChannelSetting {
  email: boolean
  push: boolean
}

export interface NotificationSettings {
  channels: Record<Exclude<NotificationCategory, 'session'>, NotificationChannelSetting>
  quietHours: {
    enabled: boolean
    start: string
    end: string
    days: number[]
  }
}

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
  session: 'Ra / Vào',
  vehicle: 'Xe',
  package: 'Gói đỗ xe',
  support: 'Hỗ trợ',
  system: 'Hệ thống',
}

export const notificationLevelLabels: Record<NotificationLevel, string> = {
  action: 'Cần xử lý',
  important: 'Quan trọng',
  info: 'Thông tin',
  success: 'Hoàn tất',
}

export const defaultNotificationSettings: NotificationSettings = {
  channels: {
    vehicle: { email: true, push: true },
    package: { email: true, push: true },
    support: { email: true, push: false },
    system: { email: false, push: true },
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '06:30',
    days: [1, 2, 3, 4, 5, 6, 0],
  },
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export function createSampleNotifications(): UserNotification[] {
  return [
    {
      id: 'sample-vehicle-document',
      category: 'vehicle',
      level: 'action',
      title: 'Bổ sung giấy tờ xe máy',
      message: 'Hồ sơ xe 59-B1 123.45 đang thiếu ảnh giấy đăng ký mặt sau. Vui lòng bổ sung để tiếp tục sử dụng dịch vụ.',
      createdAt: hoursAgo(1),
      read: false,
      pinned: true,
      vehicleLabel: '59-B1 123.45',
      actionLabel: 'Xem phương tiện',
      actionHref: '/user/vehicles',
    },
    {
      id: 'sample-session-checkout',
      category: 'session',
      level: 'important',
      title: 'Bạn chưa kết thúc lượt gửi xe',
      message: 'Lượt gửi xe tại Bãi B3 vẫn đang mở. Hãy kiểm tra mã QR khi rời bãi để hoàn tất lượt gửi.',
      createdAt: hoursAgo(3),
      read: false,
      pinned: true,
      vehicleLabel: '59-B1 123.45',
      actionLabel: 'Mở mã QR',
      actionHref: '/user/overview?tab=qr',
    },
    {
      id: 'sample-support-reply',
      category: 'support',
      level: 'info',
      title: 'Hỗ trợ đã phản hồi yêu cầu của bạn',
      message: 'Yêu cầu #HT-2025-018 đã có phản hồi mới. Mở mục hỗ trợ để xem nội dung trả lời.',
      createdAt: hoursAgo(8),
      read: false,
      pinned: false,
    },
    {
      id: 'sample-package-renewal',
      category: 'package',
      level: 'action',
      title: 'Gói gửi xe sắp hết hạn',
      message: 'Gói Xe máy tháng của bạn sẽ hết hạn trong 3 ngày. Gia hạn để tiếp tục sử dụng quyền lợi.',
      createdAt: hoursAgo(28),
      read: false,
      pinned: false,
      actionLabel: 'Xem gói đỗ xe',
      actionHref: '/user/packages',
    },
    {
      id: 'sample-vehicle-approved',
      category: 'vehicle',
      level: 'success',
      title: 'Phương tiện đã được duyệt',
      message: 'Xe máy 59-B1 123.45 đã được duyệt và có thể dùng để gửi xe tại bãi.',
      createdAt: hoursAgo(34),
      read: true,
      pinned: false,
      vehicleLabel: '59-B1 123.45',
      actionLabel: 'Xem phương tiện',
      actionHref: '/user/vehicles',
    },
    {
      id: 'sample-system-maintenance',
      category: 'system',
      level: 'info',
      title: 'Lịch bảo trì hệ thống',
      message: 'Một số tính năng có thể gián đoạn từ 23:00 đến 23:30 ngày mai để bảo trì định kỳ.',
      createdAt: hoursAgo(52),
      read: true,
      pinned: false,
    },
    {
      id: 'sample-package-payment',
      category: 'package',
      level: 'success',
      title: 'Thanh toán gói thành công',
      message: 'Giao dịch mẫu cho gói Xe máy tháng đã được ghi nhận. Đây là dữ liệu minh họa trên giao diện.',
      createdAt: hoursAgo(76),
      read: true,
      pinned: false,
      actionLabel: 'Xem gói đỗ xe',
      actionHref: '/user/packages',
    },
    {
      id: 'sample-session-completed',
      category: 'session',
      level: 'success',
      title: 'Lượt gửi xe đã hoàn tất',
      message: 'Lượt gửi tại Bãi B3 đã kết thúc. Thời lượng và phí trong lịch sử là dữ liệu mẫu.',
      createdAt: hoursAgo(101),
      read: true,
      pinned: false,
      actionLabel: 'Xem lịch sử hoạt động',
      actionHref: '/user/activity',
    },
  ]
}
