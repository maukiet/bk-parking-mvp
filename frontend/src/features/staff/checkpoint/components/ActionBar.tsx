import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { ParkingLotDto } from '../../../../types/api';
import type { CheckpointPhase, CheckpointReview } from '../types';

interface ActionBarProps {
  phase: CheckpointPhase;
  review: CheckpointReview | null;
  selectedLot: ParkingLotDto | undefined;
  entryBlockReason: string | null;
  onConfirmEntry: () => void;
  onConfirmExit: () => void;
  onResetIdle: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  phase,
  review,
  selectedLot,
  entryBlockReason,
  onConfirmEntry,
  onConfirmExit,
  onResetIdle,
}) => {
  const verified = review?.verified;
  const isSubmitting = phase === 'submitting';
  const isCheckIn = verified?.recommendedAction === 'CHECK_IN' && verified.validForEntry;
  const isCheckOut = verified?.recommendedAction === 'CHECK_OUT' && verified.validForExit;
  const available = selectedLot
    ? (selectedLot.availableSlots ?? Math.max(0, selectedLot.capacity - selectedLot.occupiedCount))
    : 0;

  return (
    <footer className="min-h-16 py-2 w-full bg-surface-card border-t border-border-default flex items-center justify-between gap-4 px-5 shrink-0 select-none flex-wrap">
      {phase === 'idle' && (
        <div className="flex items-center justify-between w-full text-xs text-text-secondary gap-2 flex-wrap">
          <span>
            Sẵn sàng — Quét mã QR hoặc nhập biển số để đối chiếu trực tiếp với cơ sở dữ liệu (F2 để focus).
          </span>
          {selectedLot && (
            <span className="font-semibold text-text-primary">
              {selectedLot.name}: còn {available}/{selectedLot.capacity} chỗ trống
            </span>
          )}
        </div>
      )}

      {phase === 'verifying' && (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-info-text">
            <Loader2 className="w-4 h-4 text-info animate-spin" />
            Đang xác thực phương tiện với Backend...
          </div>
          <Button variant="subtle" onClick={onResetIdle} icon={<RotateCcw className="w-4 h-4" />}>
            Hủy
          </Button>
        </div>
      )}

      {(phase === 'reviewed' || phase === 'submitting') && (
        <div className="flex items-center justify-between gap-3 w-full flex-wrap">
          <div className="text-xs text-text-secondary flex-1 min-w-[220px]">
            {isCheckIn && !entryBlockReason && (
              <span>
                Xác nhận ghi nhận xe <strong>{verified?.licensePlate}</strong> VÀO{' '}
                <strong>{selectedLot?.name}</strong>.
              </span>
            )}
            {isCheckIn && entryBlockReason && (
              <span className="font-semibold text-warning-text">{entryBlockReason}</span>
            )}
            {isCheckOut && (
              <span>
                Xác nhận đóng phiên gửi xe cho <strong>{verified?.licensePlate}</strong> RA khỏi{' '}
                <strong>{verified?.activeSession?.parkingLotName || 'bãi'}</strong>.
              </span>
            )}
            {!isCheckIn && !isCheckOut && (
              <span className="font-semibold text-danger-text">
                Phương tiện không đủ điều kiện qua cổng. Nhấn Esc hoặc nút bên cạnh để quét lượt mới.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={onResetIdle}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              {!isCheckIn && !isCheckOut ? 'Đóng & Quét mới (Esc)' : 'Hủy (Esc)'}
            </Button>

            {isCheckIn && (
              <Button
                variant="success"
                disabled={isSubmitting || Boolean(entryBlockReason)}
                onClick={onConfirmEntry}
                icon={
                  isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-5 h-5" />
                  )
                }
              >
                {isSubmitting ? 'Đang ghi nhận VÀO...' : 'XÁC NHẬN CHO VÀO'}
              </Button>
            )}

            {isCheckOut && (
              <Button
                variant="info"
                disabled={isSubmitting}
                onClick={onConfirmExit}
                icon={
                  isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-5 h-5" />
                  )
                }
              >
                {isSubmitting ? 'Đang ghi nhận RA...' : 'XÁC NHẬN CHO RA'}
              </Button>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};
