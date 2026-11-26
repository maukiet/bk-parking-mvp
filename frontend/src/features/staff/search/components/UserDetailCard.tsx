import React from 'react';
import { Clock, User, CheckCircle2, QrCode, Phone, ScanLine, AlertOctagon } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { ParkingSessionDto, StaffVehicleSearchResultDto } from '../../../../types/api';
import { VehiclePhotoPreview } from '../../checkpoint/components/VehiclePhotoPreview';
import {
  formatDateTime,
  formatDuration,
  formatVehicleType,
  getVehicleStatusDisplay,
} from '../../utils/formatters';
import { UserHistorySection } from './UserHistorySection';

interface UserDetailCardProps {
  vehicle: StaffVehicleSearchResultDto;
  history: ParkingSessionDto[];
  onVerifyAtCheckpoint: (code: string) => void;
}

export const UserDetailCard: React.FC<UserDetailCardProps> = ({
  vehicle,
  history,
  onVerifyAtCheckpoint,
}) => {
  const statusInfo = getVehicleStatusDisplay(vehicle.status);
  const spec = [formatVehicleType(vehicle.vehicleType), vehicle.brand, vehicle.model, vehicle.color]
    .filter(Boolean)
    .join(' · ');
  const relationshipLabel =
    vehicle.ownerRelationship === 'RELATIVE'
      ? 'Xe người thân'
      : vehicle.ownerRelationship === 'SELF'
        ? 'Xe chính chủ'
        : null;

  return (
    <section className="flex-1 flex flex-col gap-3 overflow-hidden">
      <div className="bg-surface-card border border-border-muted rounded-2xl p-4 shrink-0 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <VehiclePhotoPreview
              url={vehicle.vehiclePhotoUrl}
              alt={`Ảnh xe ${vehicle.licensePlate}`}
              sizeClassName="w-16 h-16"
            />

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  {vehicle.licensePlate}
                </span>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <Badge variant={vehicle.packageEligible ? 'success' : 'danger'}>
                  {vehicle.packageEligible
                    ? vehicle.packageEndDate
                      ? `Gói đến ${vehicle.packageEndDate}`
                      : 'Gói đỗ xe hợp lệ'
                    : 'Chưa có gói hiệu lực'}
                </Badge>
                {relationshipLabel && <Badge variant="neutral">{relationshipLabel}</Badge>}
              </div>
              <span className="text-sm text-text-secondary">{spec}</span>

              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                <span className="flex items-center gap-1 font-bold text-text-primary">
                  <User className="w-3.5 h-3.5 text-text-secondary" />
                  {vehicle.ownerName} · {vehicle.ownerCode}
                </span>
                {vehicle.ownerPhone && (
                  <span className="flex items-center gap-1 text-text-secondary">
                    <Phone className="w-3.5 h-3.5" /> {vehicle.ownerPhone}
                  </span>
                )}
              </div>

              {vehicle.qrToken && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5 flex-wrap">
                  <QrCode className="w-3.5 h-3.5 text-text-primary" />
                  <span>Mã QR:</span>
                  <code className="font-mono font-bold text-text-primary bg-surface-subtle px-2 py-0.5 rounded border border-border-default">
                    {vehicle.qrToken}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {vehicle.currentlyParked && vehicle.activeSession ? (
              <div className="bg-warning-surface border border-warning-border text-warning-text px-3.5 py-2 rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-bold">Đang gửi trong bãi</div>
                  <div className="text-[11px]">
                    {vehicle.currentParkingLot} · Vào: {formatDateTime(vehicle.activeSession.checkinTime)}
                  </div>
                  <div className="text-[11px] font-semibold">
                    Đã gửi: {formatDuration(vehicle.activeSession.checkinTime)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-subtle border border-border-default px-3.5 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-bold text-text-primary">Không có trong bãi</div>
                  <div className="text-[11px] text-text-secondary">Phương tiện đang ở ngoài</div>
                </div>
              </div>
            )}

            <Button
              variant="inverse"
              icon={<ScanLine className="w-4 h-4" />}
              onClick={() => onVerifyAtCheckpoint(vehicle.qrToken || vehicle.licensePlate)}
              className="min-h-10 py-1.5 px-4 text-xs"
            >
              Đưa sang Trạm kiểm soát
            </Button>
          </div>
        </div>

        {vehicle.status === 'REJECTED' && vehicle.rejectionReason && (
          <div className="mt-3 bg-danger-surface border border-danger-border text-danger-text p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-danger" />
            <span>
              <strong>Lý do từ chối hồ sơ:</strong> {vehicle.rejectionReason}
            </span>
          </div>
        )}
      </div>

      <UserHistorySection history={history} />
    </section>
  );
};
