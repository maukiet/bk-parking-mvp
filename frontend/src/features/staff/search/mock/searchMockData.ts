import type { UserRecord } from '../components/UserDetailCard';

export const mockSearchDatabase: UserRecord[] = [
  {
    id: 'u0',
    name: 'Nguyễn Văn An',
    code: '2311770',
    group: 'SV',
    plate: '59X3-682.45',
    vehicle: 'Xe máy · Honda AirBlade 125 · Đen Bạc',
    isInLot: true,
    checkInTime: '16/11/2026 07:30:00',
    lotName: 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)',
    history: [
      { time: '16/11/2026 07:30:00', action: 'Vào', lot: 'Nhà xe Khu A1' },
      { time: '15/11/2026 17:15:00', action: 'Ra', lot: 'Nhà xe Khu A1' },
      { time: '15/11/2026 07:20:00', action: 'Vào', lot: 'Nhà xe Khu A1' },
      { time: '14/11/2026 17:30:00', action: 'Ra', lot: 'Bãi B1' },
      { time: '14/11/2026 08:00:00', action: 'Vào', lot: 'Bãi B1' },
    ],
  },
  {
    id: 'u1',
    name: 'Trần Quốc Bảo',
    code: '2011876',
    group: 'SV',
    plate: '59X3-456.78',
    vehicle: 'Xe máy · Honda Vision 110 · Đen',
    isInLot: true,
    checkInTime: '16/11/2026 07:44:10',
    lotName: 'Nhà xe Khu A1',
    history: [
      { time: '16/11/2026 07:44:10', action: 'Vào', lot: 'Nhà xe Khu A1' },
      { time: '15/11/2026 17:15:22', action: 'Ra', lot: 'Nhà xe Khu A1' },
      { time: '15/11/2026 07:10:05', action: 'Vào', lot: 'Nhà xe Khu A1' },
    ],
  },
  {
    id: 'u2',
    name: 'Nguyễn Thị Hoa',
    code: 'GV-0421',
    group: 'GV',
    plate: '51A-123.45',
    vehicle: 'Ô tô · Toyota Vios · Trắng',
    isInLot: false,
    history: [
      { time: '15/11/2026 17:00:00', action: 'Ra', lot: 'Nhà xe Khu A1' },
      { time: '15/11/2026 07:45:00', action: 'Vào', lot: 'Nhà xe Khu A1' },
    ],
  },
];
