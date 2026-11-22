import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ReportInputRow } from './ReportInputRow';

interface ExceptionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
  initialPlate?: string;
}

export const ExceptionReportModal: React.FC<ExceptionReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlate = '59P1-123.45',
}) => {
  const [name, setName] = useState('Nguyễn Văn An');
  const [phone, setPhone] = useState('0909123456');
  const [idCard, setIdCard] = useState('079201004567');
  const [plate, setPlate] = useState(initialPlate);
  const [cardCode, setCardCode] = useState('#V088');
  const [incidentType, setIncidentType] = useState('Mất thẻ cứng khách vãng lai');
  const [desc, setDesc] = useState('Khách làm rơi thẻ, đã đối chiếu GPLX và ảnh camera lúc vào.');
  const [verified, setVerified] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;
    onSave({ name, phone, idCard, plate, cardCode, incidentType, desc });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-surface-inverse/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-xl p-5 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-info" />
            <div>
              <h2 className="text-base font-bold text-text-primary">Biên bản xử lý ngoại lệ tại trạm</h2>
              <span className="text-[11px] text-text-secondary">Trạm Bãi A · Bảo vệ: Nguyễn Văn B</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-surface-subtle">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <ReportInputRow label="Họ tên người khai báo" value={name} onChange={setName} required />
            <ReportInputRow label="Số điện thoại" value={phone} onChange={setPhone} required />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ReportInputRow label="Số CCCD / GPLX" value={idCard} onChange={setIdCard} required />
            <ReportInputRow label="Biển số xe" value={plate} onChange={setPlate} required />
            <ReportInputRow label="Mã thẻ thất lạc" value={cardCode} onChange={setCardCode} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-text-secondary text-xs">Lý do / Sự việc:</label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="bg-surface-subtle border border-border-default rounded-xl px-3 py-1.5 text-text-primary text-xs font-semibold focus:outline-none"
            >
              <option value="Mất thẻ cứng khách vãng lai">Mất thẻ cứng khách vãng lai</option>
              <option value="Xe ra không có lượt vào">Xe ra không có lượt vào</option>
              <option value="Camera / QR lỗi - Cho vào thủ công">Camera / QR lỗi - Cho vào thủ công</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-text-secondary text-xs">Nội dung xác minh:</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="bg-surface-subtle border border-border-default rounded-xl p-2 text-text-primary text-xs focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setVerified(!verified)}
            className="flex items-center gap-2 p-2 rounded-xl border border-border-default bg-surface-subtle text-left"
          >
            {verified ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <div className="w-4 h-4 rounded border shrink-0" />}
            <span className="text-[11px] font-semibold text-text-primary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" /> Đã kiểm tra đối chiếu CCCD và ảnh camera lúc vào
            </span>
          </button>

          <div className="border-t border-border-subtle pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button variant="success" disabled={!verified}>Lưu biên bản &amp; Cho qua</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
