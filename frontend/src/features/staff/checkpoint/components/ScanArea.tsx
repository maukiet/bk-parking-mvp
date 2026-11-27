import React, { useEffect, useMemo, useRef } from 'react';
import { QrCode, Loader2, Search, ArrowRight, Database, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import type { ParkingLotDto, StaffVehicleSearchResultDto } from '../../../../types/api';
import {
  formatAllowedVehicleTypes,
  getLotStatusDisplay,
  formatVehicleType,
  getVehicleStatusDisplay,
} from '../../utils/formatters';

interface ScanAreaProps {
  selectedLot: ParkingLotDto | undefined;
  vehicles: StaffVehicleSearchResultDto[];
  scanInput: string;
  onScanInputChange: (val: string) => void;
  isLoadingData: boolean;
  isVerifying: boolean;
  onVerify: (code: string) => void;
  onGoToSearch: () => void;
}

function normalizeQuery(raw: string): string {
  return raw.replace(/[-.\s]/g, '').toLowerCase();
}

export const ScanArea: React.FC<ScanAreaProps> = ({
  selectedLot,
  vehicles,
  scanInput,
  onScanInputChange,
  isLoadingData,
  isVerifying,
  onVerify,
  onGoToSearch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = scanInput.trim();
    if (!clean || isVerifying) return;
    onVerify(clean);
  };

  useEffect(() => {
    if (!isVerifying) {
      inputRef.current?.focus();
    }
  }, [isVerifying]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const autocompleteMatches = useMemo(() => {
    const clean = scanInput.trim().toLowerCase();
    const normClean = normalizeQuery(scanInput);
    if (!clean) return [];
    return vehicles
      .filter((v) => {
        const plateNorm = normalizeQuery(v.licensePlate);
        const text = `${v.licensePlate} ${v.ownerName} ${v.ownerCode} ${v.qrToken ?? ''}`.toLowerCase();
        return text.includes(clean) || (normClean.length >= 2 && plateNorm.includes(normClean));
      })
      .slice(0, 5);
  }, [scanInput, vehicles]);

  const quickDbVehicles = useMemo(() => {
    return [...vehicles]
      .sort((a, b) => {
        if (a.currentlyParked !== b.currentlyParked) return a.currentlyParked ? -1 : 1;
        if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
        if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
        return a.vehicleId - b.vehicleId;
      })
      .slice(0, 6);
  }, [vehicles]);

  const available = selectedLot
    ? (selectedLot.availableSlots ?? Math.max(0, selectedLot.capacity - selectedLot.occupiedCount))
    : 0;
  const lotStatusDisplay = selectedLot ? getLotStatusDisplay(selectedLot.status) : null;

  return (
    <div className="h-full bg-surface-card border border-border-muted rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm overflow-y-auto">
      {/* Header ngữ cảnh trạm */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-text-primary">
              {selectedLot ? selectedLot.name : 'Trạm kiểm soát'}
            </h2>
            {lotStatusDisplay && (
              <Badge variant={lotStatusDisplay.variant}>{lotStatusDisplay.label}</Badge>
            )}
          </div>
          {selectedLot && (
            <p className="text-xs text-text-secondary mt-0.5">
              Cho phép: <strong>{formatAllowedVehicleTypes(selectedLot.allowedVehicleTypes)}</strong> · Còn{' '}
              <strong>{available}/{selectedLot.capacity}</strong> chỗ trống
            </p>
          )}
        </div>

        {isVerifying ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-info-text bg-info-surface border border-info-border px-3 py-1 rounded-full">
            <Loader2 className="w-3.5 h-3.5 text-info animate-spin" /> Đang kiểm tra với DB...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success-text bg-success-surface border border-success-border px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Sẵn sàng quét (F2)
          </span>
        )}
      </div>

      {/* Khu vực quét chính */}
      <div className="flex flex-col items-center justify-center gap-4 my-auto w-full max-w-xl mx-auto">
        {isVerifying ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-info-border bg-info-surface flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-info animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-info-text text-center">
              Đang xác thực phương tiện từ cơ sở dữ liệu...
            </h3>
            <p className="text-xs text-text-secondary text-center">
              Hệ thống tự động kiểm tra trạng thái duyệt, gói đỗ xe, hạn mức bãi và lượt vào/ra đang mở.
            </p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border-default bg-surface-subtle flex items-center justify-center">
              <QrCode className="w-10 h-10 text-text-secondary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-text-primary">Quét mã QR hoặc nhập Biển số</h3>
              <p className="text-xs text-text-secondary mt-1">
                Hỗ trợ đọc mã QR, biển số đầy đủ hoặc viết liền (VD: <code>59X368245</code>). Gõ tên/MSSV để gợi ý từ DB.
              </p>
            </div>

            <div className="w-full relative">
              <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-surface-subtle border border-border-default rounded-full px-4 min-h-touch focus-within:border-border-strong">
                  <Search className="w-4 h-4 text-text-secondary shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => onScanInputChange(e.target.value)}
                    placeholder="Quét QR (BKQR-...), nhập biển số (59X3-682.45) hoặc gõ tên/MSSV..."
                    className="bg-transparent text-sm font-bold text-text-primary w-full focus:outline-none"
                  />
                </div>
                <Button
                  type="submit"
                  variant="inverse"
                  disabled={!scanInput.trim()}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Kiểm tra
                </Button>
              </form>

              {/* Autocomplete trực tiếp từ DB khi bảo vệ đang gõ */}
              {autocompleteMatches.length > 0 && (
                <div className="mt-2 bg-surface-card border border-border-default rounded-2xl shadow-lg overflow-hidden divide-y divide-border-subtle">
                  <div className="px-3 py-1.5 bg-surface-subtle text-[11px] font-bold text-text-secondary flex items-center justify-between">
                    <span>Gợi ý khớp trong CSDL ({autocompleteMatches.length})</span>
                    <span>Nhấn để kiểm tra ngay</span>
                  </div>
                  {autocompleteMatches.map((v) => {
                    const st = getVehicleStatusDisplay(v.status);
                    return (
                      <button
                        key={v.vehicleId}
                        type="button"
                        onClick={() => onVerify(v.qrToken || v.licensePlate)}
                        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-surface-subtle transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                            <span>{v.licensePlate}</span>
                            <span className="font-normal text-text-secondary">
                              · {formatVehicleType(v.vehicleType)}
                            </span>
                          </div>
                          <div className="text-[11px] text-text-secondary truncate">
                            {v.ownerName} ({v.ownerCode}) {v.qrToken ? `· ${v.qrToken}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {v.currentlyParked && (
                            <Badge variant="info" className="text-[10px] px-1.5 py-0">
                              Đang đỗ
                            </Badge>
                          )}
                          <Badge variant={st.variant} className="text-[10px] px-1.5 py-0">
                            {st.label}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dải tra nhanh xe thực trong DB */}
      <div className="bg-surface-subtle border border-border-default rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-info" />
            Phương tiện trong CSDL ({vehicles.length} xe) — Nhấn để kiểm tra nhanh
          </span>
          <button
            type="button"
            onClick={onGoToSearch}
            className="font-bold text-info-text hover:underline cursor-pointer"
          >
            Mở Tra cứu đầy đủ ({vehicles.length}) →
          </button>
        </div>

        {isLoadingData && vehicles.length === 0 ? (
          <div className="text-xs text-text-secondary py-1">Đang đọc danh sách xe từ CSDL...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-xs text-text-secondary py-1">
            Chưa có phương tiện nào trong CSDL hoặc chưa kết nối được Backend.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {quickDbVehicles.map((v) => {
              const statusInfo = getVehicleStatusDisplay(v.status);
              return (
                <button
                  key={v.vehicleId}
                  type="button"
                  disabled={isVerifying}
                  onClick={() => onVerify(v.qrToken || v.licensePlate)}
                  title={`${v.ownerName} (${v.ownerCode}) · ${v.qrToken || 'Chưa có QR'}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-card border border-border-default hover:bg-surface-hover text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="font-bold text-text-primary">{v.licensePlate}</span>
                  <span className="text-text-secondary">· {v.ownerName}</span>
                  {v.currentlyParked ? (
                    <Badge variant="info" className="text-[10px] px-1.5 py-0">Đang đỗ</Badge>
                  ) : (
                    <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                      {statusInfo.label}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
