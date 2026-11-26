import React, { useEffect } from 'react';
import {
  User,
  AlertOctagon,
  Clock,
  CheckCircle2,
  QrCode,
  MapPin,
  PackageCheck,
  Search,
  AlertTriangle,
  Phone,
  Edit3,
} from 'lucide-react';
import { Banner } from '../../../../components/ui/Banner';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { ParkingLotDto } from '../../../../types/api';
import type { CheckpointReview } from '../types';
import {
  formatDateTime,
  formatDuration,
  formatVehicleType,
  getVehicleStatusDisplay,
} from '../../utils/formatters';
import { VehiclePhotoPreview } from './VehiclePhotoPreview';

interface ScanResultCardProps {
  review: CheckpointReview;
  selectedLot: ParkingLotDto | undefined;
  entryBlockReason: string | null;
  gateNote: string;
  onGateNoteChange: (value: string) => void;
  actionError: string | null;
  isSubmitting: boolean;
  onVerifySuggestion: (code: string) => void;
  onEditQuery: (query: string) => void;
  onResetIdle: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  review,
  selectedLot,
  entryBlockReason,
  gateNote,
  onGateNoteChange,
  actionError,
  isSubmitting,
  onVerifySuggestion,
  onEditQuery,
  onResetIdle,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault();
        onResetIdle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onResetIdle]);

  if (review.notFound) {
    const { query, message, suggestions } = review.notFound;
    return (
      <div className="h-full bg-surface-card border border-border-muted rounded-2xl p-5 flex flex-col gap-4 shadow-sm overflow-y-auto">
        <Banner variant="danger" title="KHÔNG TÌM THẤY PHƯƠNG TIỆN TRONG CSDL" />

        <div className="bg-danger-surface border border-danger-border text-danger-text p-3.5 rounded-xl flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 shrink-0 text-danger mt-0.5" />
            <div className="text-sm">
              <div className="font-bold">Mã đã nhập: {query}</div>
              <div className="mt-0.5">{message}</div>
            </div>
          </div>
          <Button
            variant="outline"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => onEditQuery(query)}
            className="min-h-9 py-1.5 px-3 text-xs"
          >
            Sửa lại mã này
          </Button>
        </div>

        {suggestions.length > 0 ? (
          <div className="bg-surface-subtle border border-border-default rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Search className="w-4 h-4 text-info" />
              Tìm thấy {suggestions.length} phương tiện khớp một phần trong CSDL — Chọn để kiểm tra:
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((item) => {
                const st = getVehicleStatusDisplay(item.status);
                return (
                  <button
                    key={item.vehicleId}
                    type="button"
                    onClick={() => onVerifySuggestion(item.qrToken || item.licensePlate)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-default hover:bg-surface-hover text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <VehiclePhotoPreview
                        url={item.vehiclePhotoUrl}
                        alt={item.licensePlate}
                        sizeClassName="w-11 h-11"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary">
                          {item.licensePlate} · {formatVehicleType(item.vehicleType)}
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {item.ownerName} ({item.ownerCode}) {item.qrToken ? `· ${item.qrToken}` : ''}
                        </div>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-secondary bg-surface-subtle p-3 rounded-xl border border-border-default">
            Gợi ý: Bạn có thể nhập biển số viết liền (VD: <code>59X368245</code>), mã QR (<code>BKQR-...</code>), hoặc nhấn <strong>Esc</strong> để quay lại tìm theo MSSV / tên chủ xe.
          </div>
        )}
      </div>
    );
  }

  const v = review.verified;
  if (!v) return null;

  const isCheckIn = v.recommendedAction === 'CHECK_IN';
  const isCheckOut = v.recommendedAction === 'CHECK_OUT';
  const isDenied = v.recommendedAction === 'DENY' || !v.valid;
  const hasEntryCompatibilityIssue = isCheckIn && Boolean(entryBlockReason);

  const bannerConfig = isDenied
    ? { variant: 'danger' as const, title: 'KHÔNG HỢP LỆ — KHÔNG CHO PHÉP VÀO' }
    : hasEntryCompatibilityIssue
      ? { variant: 'warning' as const, title: 'XE HỢP LỆ NHƯNG KHÔNG ĐỦ ĐIỀU KIỆN BÃI HIỆN TẠI' }
      : isCheckIn
        ? { variant: 'success' as const, title: 'HỢP LỆ — SẴN SÀNG XÁC NHẬN VÀO BÃI' }
        : { variant: 'info' as const, title: 'XE ĐANG GỬI TRONG BÃI — SẴN SÀNG CHO RA' };

  const vehicleStatusDisplay = getVehicleStatusDisplay(v.vehicleStatus);
  const vehicleSpec = [formatVehicleType(v.vehicleType), v.brand, v.model, v.color]
    .filter(Boolean)
    .join(' · ');
  const relationshipLabel =
    v.ownerRelationship === 'RELATIVE'
      ? 'Xe người thân'
      : v.ownerRelationship === 'SELF'
        ? 'Xe chính chủ'
        : null;

  return (
    <div className="h-full bg-surface-card border border-border-muted rounded-2xl p-5 flex flex-col gap-3.5 shadow-sm overflow-y-auto">
      <Banner variant={bannerConfig.variant} title={bannerConfig.title} />

      {/* Hướng hệ thống xác định tự động */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant={isDenied ? 'danger' : isCheckIn ? 'success' : 'info'}
          className="text-xs px-3 py-1"
        >
          {isCheckIn
            ? 'Tự động xác định: LƯỢT VÀO (CHECK-IN)'
            : isCheckOut
              ? 'Tự động xác định: LƯỢT RA (CHECK-OUT)'
              : 'Quyết định hệ thống: TỪ CHỐI'}
        </Badge>
        <Badge variant={vehicleStatusDisplay.variant}>
          Hồ sơ: {vehicleStatusDisplay.label}
        </Badge>
        <Badge variant={v.packageEligible ? 'success' : 'danger'}>
          {v.packageEligible ? 'Gói đỗ xe hợp lệ' : 'Chưa có gói hiệu lực'}
        </Badge>
        {relationshipLabel && <Badge variant="neutral">{relationshipLabel}</Badge>}
      </div>

      {/* Ảnh xe thực tế + Biển số chính */}
      <div className="flex items-center gap-4 flex-wrap">
        <VehiclePhotoPreview
          url={v.vehiclePhotoUrl}
          alt={`Ảnh phương tiện ${v.licensePlate}`}
          sizeClassName="w-20 h-20"
        />
        <div className="min-w-0">
          <div className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight leading-none">
            {v.licensePlate}
          </div>
          <div className="text-sm text-text-secondary mt-1">{vehicleSpec}</div>
        </div>
      </div>

      {/* Chi tiết xe & chủ sở hữu từ DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-subtle border border-border-default rounded-2xl p-3.5 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Chủ phương tiện
          </span>
          <div className="font-bold text-text-primary">{v.ownerName}</div>
          <div className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
            <span>Mã: <strong className="text-text-primary">{v.ownerCode}</strong></span>
            {v.ownerPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> <strong className="text-text-primary">{v.ownerPhone}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5" /> Quyền gửi &amp; Gói đỗ xe
          </span>
          <div className="font-bold text-text-primary">
            {v.packageName || 'Chưa đăng ký gói hiệu lực'}
          </div>
          <div className="text-xs text-text-secondary">
            {v.packageEndDate ? (
              <span>Hạn gói đến: <strong className="text-text-primary">{v.packageEndDate}</strong></span>
            ) : v.packageEligible ? (
              <span>
                {v.packageName?.toLowerCase().includes('lương')
                  ? 'Hiệu lực theo chính sách trường'
                  : 'Gói đỗ xe đang hiệu lực'}
              </span>
            ) : (
              <span>Cần gia hạn gói để gửi xe</span>
            )}
          </div>
        </div>

        {v.qrToken && (
          <div className="sm:col-span-2 pt-2 border-t border-border-subtle flex items-center gap-2 text-xs text-text-secondary flex-wrap">
            <QrCode className="w-3.5 h-3.5 text-text-primary shrink-0" />
            <span>Mã QR định danh:</span>
            <code className="font-mono font-bold text-text-primary bg-surface-card px-2 py-0.5 rounded border border-border-default">
              {v.qrToken}
            </code>
          </div>
        )}
      </div>

      {/* Thông tin phiên đang gửi (nếu CHECK_OUT) */}
      {isCheckOut && v.activeSession && (
        <div className="bg-info-surface border border-info-border text-info-text rounded-2xl p-3.5 flex flex-col gap-1.5 text-xs">
          <div className="font-bold text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0" />
            Thông tin lượt đang gửi trong DB
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              Bãi đang gửi: <strong className="text-text-primary">{v.activeSession.parkingLotName}</strong>
            </div>
            <div>
              Cổng vào: <strong className="text-text-primary">{v.activeSession.entryGate || '—'}</strong>
            </div>
            <div>
              Giờ vào: <strong className="text-text-primary">{formatDateTime(v.activeSession.checkinTime)}</strong>
            </div>
            <div>
              Thời gian đã gửi:{' '}
              <strong className="text-text-primary">{formatDuration(v.activeSession.checkinTime)}</strong>
            </div>
            {v.activeSession.checkinStaffName && (
              <div className="sm:col-span-2">
                Bảo vệ xác nhận vào: <strong className="text-text-primary">{v.activeSession.checkinStaffName}</strong>
              </div>
            )}
          </div>
          {selectedLot && v.activeSession.parkingLotId !== selectedLot.id && (
            <div className="mt-1 pt-1.5 border-t border-info-border font-semibold text-warning-text">
              Lưu ý: Xe vào tại <strong>{v.activeSession.parkingLotName}</strong>, trạm đang chọn <strong>{selectedLot.name}</strong>. Khi bấm xác nhận RA, hệ thống sẽ đóng phiên đang mở tại {v.activeSession.parkingLotName}.
            </div>
          )}
        </div>
      )}

      {/* Bãi nhận xe (nếu CHECK_IN) */}
      {isCheckIn && selectedLot && (
        <div
          className={`rounded-2xl p-3.5 border text-xs flex flex-col gap-1 ${
            entryBlockReason
              ? 'bg-warning-surface border-warning-border text-warning-text'
              : 'bg-success-surface border-success-border text-success-text'
          }`}
        >
          <div className="font-bold text-sm flex items-center gap-1.5">
            {entryBlockReason ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 shrink-0" />
            )}
            <span>Bãi tiếp nhận lượt vào: {selectedLot.name}</span>
          </div>
          {entryBlockReason ? (
            <div className="font-semibold">{entryBlockReason}</div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{v.statusMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Lý do từ chối từ Backend */}
      {isDenied && (
        <div className="bg-danger-surface border border-danger-border text-danger-text p-3.5 rounded-xl flex items-start gap-2">
          <AlertOctagon className="w-5 h-5 shrink-0 text-danger mt-0.5" />
          <div className="text-sm">
            <div className="font-bold">{v.statusMessage}</div>
            {v.rejectionReason && (
              <div className="text-xs mt-1">
                Lý do từ Admin: <strong>{v.rejectionReason}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ghi chú tuỳ chọn khi xác nhận Check-in / Check-out */}
      {!isDenied && (
        <div className="flex flex-col gap-1">
          <label htmlFor="staff-gate-note" className="text-xs font-bold text-text-secondary">
            Ghi chú của bảo vệ (không bắt buộc — sẽ lưu vào lịch sử lượt xe):
          </label>
          <input
            id="staff-gate-note"
            type="text"
            value={gateNote}
            onChange={(e) => onGateNoteChange(e.target.value)}
            placeholder={
              isCheckIn
                ? 'VD: Đã đối chiếu biển số thực tế lúc vào...'
                : 'VD: Xe ra bình thường...'
            }
            className="bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-border-strong"
          />
        </div>
      )}

      {/* Lỗi từ API khi bấm xác nhận */}
      {actionError && (
        <div className="bg-danger-surface border border-danger-border text-danger-text p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-danger" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
};
