import React from 'react';
import { X, CreditCard, LogOut } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { ShiftSummaryData } from '../types';

interface ShiftSummaryPanelProps {
  data: ShiftSummaryData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEndShift: () => void;
}

export const ShiftSummaryPanel: React.FC<ShiftSummaryPanelProps> = ({
  data,
  isOpen,
  onClose,
  onConfirmEndShift,
}) => {
  if (!isOpen) return null;

  const currentGuestInLot = Math.max(0, data.guestCardsIssued - data.guestCardsCollected);

  return (
    <div className="absolute inset-0 bg-surface-inverse/40 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Tổng kết ca trực</h2>
            <p className="text-xs text-text-secondary">Ca sáng 06:00–14:00 · Nhân viên: Nguyễn Văn B</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-surface-subtle">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-surface-subtle p-3 rounded-xl">
            <span className="text-xs text-text-secondary">Lượt xe trong ca:</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">
              {data.totalIn} Vào · {data.totalOut} Ra
            </div>
          </div>

          <div className="bg-info-surface border border-info-border p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-info-text font-semibold">Khách vãng lai (Thẻ cứng):</span>
              <div className="text-xl font-bold text-info-text mt-0.5">
                Cấp {data.guestCardsIssued} · Thu {data.guestCardsCollected}
              </div>
              <div className="text-[11px] text-text-secondary">
                {currentGuestInLot} xe khách đang gửi trong bãi
              </div>
            </div>
            <CreditCard className="w-7 h-7 text-info shrink-0" />
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl">
            <span className="text-xs text-text-secondary">Số lượt từ chối:</span>
            <div className="text-xl font-bold text-danger mt-0.5">{data.rejectedCount} lượt</div>
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl">
            <span className="text-xs text-text-secondary">Ngoại lệ đã giải quyết:</span>
            <div className="text-xl font-bold text-warning-text mt-0.5">{data.exceptionCount} vụ</div>
          </div>
        </div>

        <div className="text-xs text-text-secondary pt-1">
          * Phí dịch vụ khách vãng lai được xử lý bên ngoài trạm. Hệ thống lưu trữ đối soát số lượt cấp và thu hồi thẻ cứng.
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-3">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="danger" icon={<LogOut className="w-4 h-4" />} onClick={onConfirmEndShift}>
            Xác nhận kết thúc ca
          </Button>
        </div>
      </div>
    </div>
  );
};
