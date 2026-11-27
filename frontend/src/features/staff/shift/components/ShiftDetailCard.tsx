import React from 'react';
import { Clock, MapPin, ScanLine, User, CheckCircle2, Shield } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { ParkingSessionDto } from '../../../../types/api';
import { formatDateTime, formatDuration, formatVehicleType } from '../../utils/formatters';

interface ShiftDetailCardProps {
  session: ParkingSessionDto | undefined;
  onVerifyAtCheckpoint: (code: string) => void;
}

export const ShiftDetailCard: React.FC<ShiftDetailCardProps> = ({
  session,
  onVerifyAtCheckpoint,
}) => {
  if (!session) {
    return (
      <Card headerTitle="Chi tiết phiên gửi xe" className="h-full justify-center items-center">
        <p className="text-sm text-text-secondary">Chọn một lượt xe bên trái để xem chi tiết.</p>
      </Card>
    );
  }

  const isActive = session.status === 'ACTIVE';

  return (
    <Card
      headerTitle={`Phiên #${session.sessionId} · ${session.licensePlate}`}
      headerRight={
        <Badge variant={isActive ? 'warning' : 'success'}>
          {isActive ? 'Đang gửi (ACTIVE)' : 'Đã hoàn tất (COMPLETED)'}
        </Badge>
      }
      className="h-full justify-between"
    >
      <div className="flex flex-col gap-4 text-xs overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border-subtle">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {session.licensePlate}
            </div>
            <div className="text-sm text-text-secondary mt-0.5">
              {formatVehicleType(session.vehicleType)} · Chủ xe:{' '}
              <strong className="text-text-primary">{session.ownerName}</strong> ({session.ownerCode})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-surface-subtle p-3 rounded-xl border border-border-default">
            <span className="text-text-secondary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Bãi đỗ xe
            </span>
            <div className="text-sm font-bold text-text-primary mt-1">{session.parkingLotName}</div>
            <div className="text-[11px] text-text-secondary">{session.parkingLotCode}</div>
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl border border-border-default">
            <span className="text-text-secondary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Thời lượng gửi
            </span>
            <div className="text-sm font-bold text-text-primary mt-1">
              {formatDuration(session.checkinTime, session.checkoutTime)}
            </div>
            <div className="text-[11px] text-text-secondary">
              {isActive ? 'Tính tới hiện tại' : 'Tổng thời gian gửi'}
            </div>
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl border border-border-default">
            <span className="text-text-secondary">Giờ VÀO &amp; Cổng vào</span>
            <div className="text-sm font-bold text-text-primary mt-1">
              {formatDateTime(session.checkinTime)}
            </div>
            <div className="text-[11px] text-text-secondary">{session.entryGate || 'Cổng chính'}</div>
            {session.checkinStaffName && (
              <div className="text-[11px] text-text-primary font-semibold mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-success" /> Xác nhận vào: {session.checkinStaffName}
              </div>
            )}
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl border border-border-default">
            <span className="text-text-secondary">Giờ RA &amp; Cổng ra</span>
            <div className="text-sm font-bold text-text-primary mt-1">
              {session.checkoutTime ? formatDateTime(session.checkoutTime) : 'Chưa rời bãi'}
            </div>
            <div className="text-[11px] text-text-secondary">{session.exitGate || '—'}</div>
            {session.checkoutStaffName && (
              <div className="text-[11px] text-text-primary font-semibold mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-info" /> Xác nhận ra: {session.checkoutStaffName}
              </div>
            )}
          </div>
        </div>

        {session.note && (
          <div className="bg-info-surface border border-info-border text-info-text p-3 rounded-xl">
            <div className="font-bold">Ghi chú của bảo vệ / hệ thống:</div>
            <div className="mt-0.5">{session.note}</div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-text-secondary flex items-center gap-1">
          {isActive ? (
            <>
              <User className="w-3.5 h-3.5" /> Chuyển sang Trạm kiểm soát để đối chiếu và xác nhận cho xe ra.
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Phiên đã đóng và đồng bộ trong DB.
            </>
          )}
        </span>

        {isActive && (
          <Button
            variant="info"
            icon={<ScanLine className="w-4 h-4" />}
            onClick={() => onVerifyAtCheckpoint(session.licensePlate)}
            className="min-h-10 py-1.5 px-4 text-xs"
          >
            Cho ra tại Trạm kiểm soát
          </Button>
        )}
      </div>
    </Card>
  );
};
