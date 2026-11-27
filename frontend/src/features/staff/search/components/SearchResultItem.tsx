import React from 'react';
import { CheckCircle2, ScanLine, XCircle } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { StaffVehicleSearchResultDto } from '../../../../types/api';
import { VehiclePhotoPreview } from '../../checkpoint/components/VehiclePhotoPreview';
import { formatVehicleType, getVehicleStatusDisplay } from '../../utils/formatters';

interface SearchResultItemProps {
  vehicle: StaffVehicleSearchResultDto;
  onViewDetail: (vehicle: StaffVehicleSearchResultDto) => void;
  onVerifyAtCheckpoint: (code: string) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  vehicle,
  onViewDetail,
  onVerifyAtCheckpoint,
}) => {
  const statusInfo = getVehicleStatusDisplay(vehicle.status);
  const spec = [formatVehicleType(vehicle.vehicleType), vehicle.brand, vehicle.model, vehicle.color]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <VehiclePhotoPreview
          url={vehicle.vehiclePhotoUrl}
          alt={vehicle.licensePlate}
          sizeClassName="w-12 h-12"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-extrabold text-text-primary">{vehicle.licensePlate}</span>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <Badge variant={vehicle.packageEligible ? 'success' : 'danger'}>
              {vehicle.packageEligible
                ? vehicle.packageEndDate
                  ? `Gói đến ${vehicle.packageEndDate}`
                  : 'Có gói hợp lệ'
                : 'Chưa có gói'}
            </Badge>
          </div>
          <div className="text-xs text-text-secondary mt-0.5 truncate">{spec}</div>
          <div className="text-xs font-semibold text-text-primary mt-0.5">
            {vehicle.ownerName} · <span className="text-text-secondary">{vehicle.ownerCode}</span>
            {vehicle.qrToken && (
              <span className="ml-2 font-mono text-[11px] text-text-secondary">
                [{vehicle.qrToken}]
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        <div className="flex items-center gap-1 text-xs font-semibold mr-1">
          {vehicle.currentlyParked ? (
            <span className="flex items-center gap-1 text-warning-text bg-warning-surface border border-warning-border px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {vehicle.currentParkingLot ? `Đang gửi (${vehicle.currentParkingLot})` : 'Đang trong bãi'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-text-secondary">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              Ngoài bãi
            </span>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => onViewDetail(vehicle)}
          className="min-h-10 py-1.5 px-3.5 text-xs"
        >
          Chi tiết
        </Button>

        <Button
          variant="inverse"
          icon={<ScanLine className="w-4 h-4" />}
          onClick={() => onVerifyAtCheckpoint(vehicle.qrToken || vehicle.licensePlate)}
          className="min-h-10 py-1.5 px-3.5 text-xs"
        >
          Kiểm tra tại Trạm
        </Button>
      </div>
    </div>
  );
};
