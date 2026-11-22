import React, { useState } from 'react';
import { CreditCard, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface GuestExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cardCode: string) => void;
}

export const GuestExitModal: React.FC<GuestExitModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [cardCode, setCardCode] = useState('#V088');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(cardCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-surface-inverse/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-info" />
            <h2 className="text-lg font-bold text-text-primary">Thu hồi thẻ khách vãng lai</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-surface-subtle">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="bg-info-surface border border-info-border text-info-text p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Khách vãng lai (Lượt ra):</span>
              <div className="text-base font-bold text-text-primary mt-0.5">Thu hồi thẻ cứng</div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Thu phí thực hiện bên ngoài · Trạm chỉ thu hồi thẻ và lưu lượt xe
              </div>
            </div>
            <CreditCard className="w-7 h-7 text-info shrink-0" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Mã thẻ khách trả lại quầy:
            </label>
            <input
              type="text"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              placeholder="VD: #V088"
              className="text-base font-bold bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none"
              required
            />
          </div>

          <div className="bg-surface-subtle p-3 rounded-xl border border-border-default flex items-center gap-2 text-xs text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Camera đã tự động chụp và lưu trữ ảnh biển số lượt ra của xe khách.</span>
          </div>

          <div className="border-t border-border-subtle pt-3 flex items-center justify-end gap-2 mt-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="info" icon={<ArrowRight className="w-4 h-4" />}>
              Xác nhận thu thẻ &amp; Cho ra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
