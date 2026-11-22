import React, { useState } from 'react';
import { AlertTriangle, CheckSquare, Square, CreditCard, ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { ExceptionCase } from './ExceptionCaseList';
import { ExceptionReportModal } from './ExceptionReportModal';

interface ExceptionDetailProps {
  currentCase: ExceptionCase;
  verified: boolean;
  note: string;
  successId: string | null;
  onToggleVerified: () => void;
  onNoteChange: (v: string) => void;
  onConfirm: () => void;
}

export const ExceptionDetail: React.FC<ExceptionDetailProps> = ({
  currentCase,
  verified,
  note,
  successId,
  onToggleVerified,
  onNoteChange,
  onConfirm,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [savedReport, setSavedReport] = useState<string | null>(null);

  const handleSaveReport = (data: Record<string, string>) => {
    setSavedReport(`Đã lưu biên bản cho ${data.name} (CCCD: ${data.idCard})`);
    if (!verified) onToggleVerified();
  };

  return (
    <section className="flex-1 h-full bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="bg-warning-surface border border-warning-border text-warning-text p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">{currentCase.title} – Xử lý tại chỗ</span>
          </div>
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-card text-text-primary border border-warning-border hover:bg-surface-subtle font-bold text-xs"
          >
            <FileText className="w-4 h-4 text-info" /> Lập biên bản
          </button>
        </div>

        {savedReport && (
          <div className="bg-success-surface border border-success-border text-success-text p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{savedReport}</span>
          </div>
        )}

        <div>
          <div className="text-4xl font-bold text-text-primary">{currentCase.plate}</div>
          <div className="text-sm text-text-secondary">{currentCase.vehicle}</div>
          <div className="text-base font-bold text-text-primary mt-1">{currentCase.owner} · {currentCase.role}</div>
        </div>

        {currentCase.feeNote && (
          <div className="bg-info-surface border border-info-border text-info-text p-3 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold">{currentCase.feeNote}</span>
            <CreditCard className="w-5 h-5 text-info shrink-0" />
          </div>
        )}

        <button
          type="button"
          onClick={onToggleVerified}
          className="flex items-center gap-2.5 bg-surface-subtle p-3 rounded-xl text-left border border-border-default hover:bg-surface-hover"
        >
          {verified ? <CheckSquare className="w-5 h-5 text-success shrink-0" /> : <Square className="w-5 h-5 text-text-secondary shrink-0" />}
          <span className="text-sm font-semibold text-text-primary">Đã đối chiếu camera và xác minh biển số thực tế</span>
        </button>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-text-secondary">Ghi chú xác minh lý do:</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Nhập lý do ngoại lệ..."
            className="w-full text-sm bg-surface-subtle border border-border-default rounded-xl p-2.5 text-text-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="border-t border-border-subtle pt-3 flex items-center justify-between">
        <div className="text-xs text-text-secondary">
          {currentCase.type === 'no_entry_record'
            ? 'Xe ra không có lượt vào: Ghi nhận và cho ra luôn, không cần quản lý duyệt.'
            : 'Xác minh tại chỗ trong phạm vi thẩm quyền đã cấp.'}
        </div>
        <Button
          variant="success"
          icon={<ArrowRight className="w-4 h-4" />}
          disabled={!verified || successId !== null}
          onClick={onConfirm}
        >
          {currentCase.type === 'qr_camera_error' ? 'Xác nhận cho vào' : 'Xác nhận cho ra'}
        </Button>
      </div>

      <ExceptionReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSave={handleSaveReport}
        initialPlate={currentCase.plate}
      />
    </section>
  );
};
