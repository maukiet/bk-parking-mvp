import React from 'react';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import type { ParkingLotDto } from '../../../../types/api';
import { formatAllowedVehicleTypes, formatTimeOnly, getLotStatusDisplay } from '../../utils/formatters';

interface LotStatusCardProps {
  lot: ParkingLotDto | undefined;
  isLoading: boolean;
}

export const LotStatusCard: React.FC<LotStatusCardProps> = ({ lot, isLoading }) => {
  if (!lot) {
    return (
      <Card headerTitle="Tình trạng bãi đang trực">
        <div className="text-xs text-text-secondary py-2">
          {isLoading ? 'Đang tải thông tin bãi đỗ xe từ DB...' : 'Chưa có dữ liệu bãi đỗ xe.'}
        </div>
      </Card>
    );
  }

  const available = lot.availableSlots ?? Math.max(0, lot.capacity - lot.occupiedCount);
  const percent =
    lot.occupancyRate ?? (lot.capacity > 0 ? Math.round((lot.occupiedCount / lot.capacity) * 100) : 0);
  const statusDisplay = getLotStatusDisplay(lot.status);
  const isNearFull = percent >= 90 || lot.status === 'FULL';
  const isClosed = lot.status !== 'OPEN' && lot.status !== 'FULL';

  return (
    <Card
      headerTitle={lot.code}
      headerRight={<Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>}
    >
      <div className="text-xs font-semibold text-text-secondary -mt-1 truncate" title={lot.name}>
        {lot.name}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-2xl font-bold text-text-primary leading-tight">
            còn {available} chỗ
          </div>
          <div className="text-xs text-text-secondary">
            Đang gửi: <strong className="text-text-primary">{lot.occupiedCount}</strong> / {lot.capacity} xe
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 font-bold text-sm ${
            isNearFull
              ? 'text-danger'
              : isClosed
                ? 'text-warning-text'
                : 'text-success-text'
          }`}
        >
          {isClosed ? (
            <Lock className="w-4 h-4 shrink-0" />
          ) : isNearFull ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <div className="text-right">
            <div>{percent}%</div>
            <div className="text-[11px] font-normal text-text-secondary">lấp đầy</div>
          </div>
        </div>
      </div>

      <ProgressBar value={percent} />

      <div className="flex flex-col gap-0.5 text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
        <span>Nhận: <strong className="text-text-primary">{formatAllowedVehicleTypes(lot.allowedVehicleTypes)}</strong></span>
        <span>Cập nhật DB: {formatTimeOnly(lot.updatedAt)}</span>
      </div>
    </Card>
  );
};
