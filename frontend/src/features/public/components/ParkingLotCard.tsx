import React from 'react';
import { Bike, Clock, MapPin } from 'lucide-react';
import type { ParkingLotDto } from '../../../types/api';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';
import {
  formatAllowedVehicleTypes,
  formatTimeOnly,
  getLotStatusDisplay,
} from '../../staff/utils/formatters';

interface ParkingLotCardProps {
  lot: ParkingLotDto;
}

function getCardStatusBadge(lot: ParkingLotDto) {
  if (lot.status === 'CLOSED' || lot.status === 'MAINTENANCE') {
    return getLotStatusDisplay(lot.status);
  }
  if (lot.occupancyRate >= 90 || lot.status === 'FULL') {
    return { label: 'Gần đầy', variant: 'danger' as const };
  }
  if (lot.occupancyRate >= 70) {
    return { label: 'Sắp đầy', variant: 'warning' as const };
  }
  return { label: 'Còn nhiều', variant: 'success' as const };
}

export const ParkingLotCard: React.FC<ParkingLotCardProps> = ({ lot }) => {
  const available = lot.availableSlots ?? Math.max(0, lot.capacity - lot.occupiedCount);
  const percent =
    lot.occupancyRate ?? (lot.capacity > 0 ? Math.round((lot.occupiedCount / lot.capacity) * 100) : 0);
  const badge = getCardStatusBadge(lot);
  const isClosed = lot.status === 'CLOSED' || lot.status === 'MAINTENANCE';

  const rateTextClass = isClosed
    ? 'text-text-secondary'
    : badge.variant === 'danger'
      ? 'text-danger'
      : badge.variant === 'warning'
        ? 'text-warning-text'
        : 'text-success-text';

  return (
    <article
      className={`bg-surface-card border rounded-3xl p-5 flex flex-col justify-between shadow-sm transition-all min-w-0 ${
        isClosed ? 'border-border-default opacity-80' : 'border-border-default hover:shadow-md'
      }`}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary bg-surface-subtle border border-border-default px-2 py-0.5 rounded-md">
                {lot.code}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text-primary leading-tight mt-1">{lot.name}</h3>
            {lot.location && (
              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lot.location}</span>
              </p>
            )}
          </div>
          <Badge variant={badge.variant} className="shrink-0">
            {badge.label}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          {isClosed ? (
            <span className="text-xl font-extrabold text-text-secondary">
              {lot.status === 'MAINTENANCE' ? 'Đang bảo trì' : 'Tạm đóng cửa'}
            </span>
          ) : (
            <>
              <span className="text-3xl font-extrabold text-text-primary">còn {available}</span>
              <span className="text-sm font-semibold text-text-secondary">chỗ trống</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs mt-1 gap-2">
          <span className={`font-bold ${rateTextClass}`}>{percent}% lấp đầy</span>
          <span className="text-text-secondary">
            {lot.occupiedCount} / {lot.capacity} xe
          </span>
        </div>

        <ProgressBar value={percent} className="mt-1" />
      </div>

      <div className="border-t border-border-subtle pt-3 mt-4 flex items-center justify-between gap-2 text-[11px] text-text-secondary flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Bike className="w-3.5 h-3.5 text-text-primary shrink-0" />
          <span className="truncate" title={formatAllowedVehicleTypes(lot.allowedVehicleTypes)}>
            {formatAllowedVehicleTypes(lot.allowedVehicleTypes)}
          </span>
        </div>
        <span className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" /> Cập nhật: {formatTimeOnly(lot.updatedAt)}
        </span>
      </div>
    </article>
  );
};
