import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, note: string) => void;
}

const incidentTypes = [
  'Barrier không đóng/mở tự động',
  'Camera AI nhận diện sai / mờ',
  'Đầu đọc thẻ RFID không phản hồi',
  'Mất kết nối mạng cục bộ LAN',
  'Sự cố trật tự / đỗ sai quy định',
  'Khác',
];

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState(incidentTypes[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedType, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-surface-inverse/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-bold text-text-primary">Báo sự cố tại trạm Bãi A</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-surface-subtle">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary">Loại sự cố phát sinh:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm font-semibold bg-surface-subtle border border-border-default rounded-xl p-2.5 text-text-primary focus:outline-none"
            >
              {incidentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary">Chi tiết sự cố / Ghi chú xử lý:</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả hiện trạng sự cố cần kỹ thuật hoặc quản trị viên hỗ trợ..."
              className="text-sm bg-surface-subtle border border-border-default rounded-xl p-2.5 text-text-primary focus:outline-none"
            />
          </div>

          <div className="bg-surface-subtle p-2.5 rounded-xl text-xs text-text-secondary flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-info shrink-0" />
            <span>Đường dây nóng kỹ thuật cơ sở 1: 028.3864.7256 (máy lẻ 5800)</span>
          </div>

          <div className="border-t border-border-subtle pt-3 flex items-center justify-end gap-2 mt-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button variant="danger" icon={<ArrowRight className="w-4 h-4" />}>
              Gửi báo cáo sự cố
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

