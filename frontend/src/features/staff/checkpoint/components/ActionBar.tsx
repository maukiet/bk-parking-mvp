import React from 'react';
import { X, CreditCard, AlertCircle, PhoneCall, Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { ScanState } from '../types';

interface ActionBarProps {
  scanState: ScanState;
  isSubmitting: boolean;
  isOffline: boolean;
  onReject: () => void;
  onTransferException: () => void;
  onResetIdle: () => void;
  onOpenGuestIssue: () => void;
  onOpenGuestExit: () => void;
  onOpenIncident: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  scanState,
  isSubmitting,
  isOffline,
  onReject,
  onTransferException,
  onResetIdle,
  onOpenGuestIssue,
  onOpenGuestExit,
  onOpenIncident,
}) => {
  return (
    <footer className="h-actionbar w-full bg-surface-card border-t border-border-default flex items-center justify-between px-4 shrink-0 select-none">
      {/* Cụm nút hành động quyết định bên trái (~60%) */}
      <div className="flex-1 flex items-center gap-3">
        {scanState === 'reading' && (
          <div className="flex items-center gap-2 text-sm font-semibold text-info-text">
            <Loader2 className="w-4 h-4 text-info animate-spin" />
            Đang xác thực, vui lòng chờ...
          </div>
        )}

        {scanState === 'valid' && (
          <div className="flex items-center gap-3 w-full">
            <span className="text-sm font-bold text-success-text flex-1">
              ✓ Lượt xe đã được ghi nhận tự động vào hệ thống.
            </span>
            <Button variant="inverse" icon={<ArrowRight className="w-5 h-5" />} onClick={onResetIdle}>
              Lượt tiếp theo
            </Button>
          </div>
        )}

        {scanState === 'invalid' && (
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="danger"
              icon={<X className="w-5 h-5" />}
              disabled={isSubmitting}
              onClick={onReject}
              className="w-48"
            >
              TỪ CHỐI
            </Button>
            <Button variant="outline" disabled={isSubmitting} onClick={onTransferException} className="flex-1">
              Chuyển Xử lý ngoại lệ
            </Button>
          </div>
        )}

        {scanState === 'manual' && isOffline && (
          <div className="flex items-center gap-3 w-full">
            <Button variant="info" icon={<Check className="w-5 h-5" />} onClick={onResetIdle} className="flex-1">
              Cho qua (Ngoại tuyến)
            </Button>
            <Button variant="danger" icon={<X className="w-5 h-5" />} onClick={onReject} className="w-44">
              Từ chối
            </Button>
          </div>
        )}

        {scanState === 'idle' && (
          <div className="text-xs text-text-secondary">
            Sẵn sàng nhận diện lượt quét QR hoặc quét thẻ cứng khách vãng lai.
          </div>
        )}
      </div>

      {/* Cụm nút nghiệp vụ phụ bên phải */}
      <div className="flex items-center justify-end gap-2 pl-4">
        <Button
          variant="info"
          icon={<CreditCard className="w-4 h-4" />}
          onClick={onOpenGuestIssue}
          className="text-xs px-3"
          disabled={scanState === 'reading'}
        >
          Cấp thẻ khách
        </Button>
        <Button
          variant="subtle"
          icon={<CreditCard className="w-4 h-4" />}
          onClick={onOpenGuestExit}
          className="text-xs px-3"
          disabled={scanState === 'reading'}
        >
          Thu thẻ khách
        </Button>
        <Button
          variant="subtle"
          icon={<AlertCircle className="w-4 h-4" />}
          onClick={onTransferException}
          className="text-xs px-3"
          disabled={scanState === 'reading'}
        >
          Xử lý ngoại lệ
        </Button>
        <Button
          variant="subtle"
          icon={<PhoneCall className="w-4 h-4" />}
          onClick={onOpenIncident}
          className="text-xs px-3"
          disabled={scanState === 'reading'}
        >
          Báo sự cố
        </Button>
      </div>
    </footer>
  );
};
