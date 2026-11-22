import React, { useState } from 'react';
import { CreditCard, Camera, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface GuestIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cardCode: string, plate: string) => void;
}

export const GuestIssueModal: React.FC<GuestIssueModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [cardCode, setCardCode] = useState('#V089');
  const [plate, setPlate] = useState('59H2-789.01');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim()) return;
    onConfirm(cardCode.trim(), plate.trim() || 'Xe khách vãng lai');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-surface-inverse/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-info" />
            <h2 className="text-lg font-bold text-text-primary">Cấp thẻ cứng khách vãng lai</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-surface-subtle">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="bg-info-surface border border-info-border text-info-text p-3 rounded-xl text-xs">
            Bảo vệ lấy thẻ cứng vật lý tại quầy, quẹt qua đầu đọc hoặc nhập mã thẻ để bàn giao cho khách.
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary">Mã thẻ cứng vật lý:</label>
            <input
              type="text"
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value)}
              placeholder="VD: #V089"
              className="text-base font-bold bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> Biển số do camera chụp tự động:
            </label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="VD: 59H2-789.01"
              className="text-base font-bold bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none"
            />
          </div>

          <div className="border-t border-border-subtle pt-3 flex items-center justify-end gap-2 mt-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="info" icon={<ArrowRight className="w-4 h-4" />}>
              Cấp thẻ &amp; Mở barrier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

