import type { ParkingLotDto, ParkingLotStatus, VehicleStatus, VehicleType } from '../../../types/api';

const vehicleTypeLabels: Record<VehicleType, string> = {
  MOTORBIKE: 'Xe máy',
  ELECTRIC_BIKE: 'Xe điện',
  BICYCLE: 'Xe đạp',
  CAR: 'Ô tô',
};

export function formatVehicleType(type: string | null | undefined): string {
  if (!type) return 'Phương tiện';
  return vehicleTypeLabels[type as VehicleType] ?? type;
}

export function formatAllowedVehicleTypes(raw: string | null | undefined): string {
  if (!raw) return 'Tất cả';
  return raw
    .split(',')
    .map((part) => formatVehicleType(part.trim()))
    .filter(Boolean)
    .join(', ');
}

export function lotAcceptsVehicleType(lot: ParkingLotDto | undefined, vehicleType: string): boolean {
  if (!lot?.allowedVehicleTypes) return true;
  return lot.allowedVehicleTypes
    .split(',')
    .map((part) => part.trim().toUpperCase())
    .includes(vehicleType.trim().toUpperCase());
}

export interface StatusDisplay {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const vehicleStatusMap: Record<VehicleStatus, StatusDisplay> = {
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  REJECTED: { label: 'Bị từ chối', variant: 'danger' },
  LOCKED: { label: 'Đang khóa', variant: 'danger' },
  CANCELED: { label: 'Đã hủy', variant: 'neutral' },
};

export function getVehicleStatusDisplay(status: string | null | undefined): StatusDisplay {
  if (!status) return { label: 'Không rõ', variant: 'neutral' };
  return vehicleStatusMap[status as VehicleStatus] ?? { label: status, variant: 'neutral' };
}

const lotStatusMap: Record<ParkingLotStatus, StatusDisplay> = {
  OPEN: { label: 'Đang mở', variant: 'success' },
  FULL: { label: 'Đã đầy', variant: 'danger' },
  MAINTENANCE: { label: 'Bảo trì', variant: 'warning' },
  CLOSED: { label: 'Đóng cửa', variant: 'neutral' },
};

export function getLotStatusDisplay(status: string | null | undefined): StatusDisplay {
  if (!status) return { label: 'Không rõ', variant: 'neutral' };
  return lotStatusMap[status as ParkingLotStatus] ?? { label: status, variant: 'neutral' };
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatTimeOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(11, 19) || iso;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDuration(startIso: string | null | undefined, endIso?: string | null): string {
  if (!startIso) return '—';
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  const totalMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} ngày ${hours} giờ ${minutes} phút`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

export function isSameLocalDate(iso: string | null | undefined, refDate = new Date()): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === refDate.getFullYear() &&
    date.getMonth() === refDate.getMonth() &&
    date.getDate() === refDate.getDate()
  );
}
