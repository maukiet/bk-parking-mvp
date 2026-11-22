import React from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

export interface ExceptionCase {
  id: string;
  type: 'qr_camera_error' | 'lost_guest_card' | 'no_entry_record';
  title: string;
  plate: string;
  time: string;
  lot: string;
  owner: string;
  role: string;
  vehicle: string;
  feeNote?: string;
}

interface ExceptionCaseListProps {
  cases: ExceptionCase[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreateReport?: () => void;
}

type BadgeVariant = 'warning' | 'danger' | 'info';

const typeBadgeVariant: Record<ExceptionCase['type'], BadgeVariant> = {
  qr_camera_error: 'warning',
  lost_guest_card: 'danger',
  no_entry_record: 'info',
};

const typeLabel: Record<ExceptionCase['type'], string> = {
  qr_camera_error: 'Camera/QR lỗi',
  lost_guest_card: 'Mất thẻ cứng',
  no_entry_record: 'Ra không có lượt vào',
};

export const ExceptionCaseList: React.FC<ExceptionCaseListProps> = ({
  cases,
  selectedId,
  onSelect,
  onCreateReport,
}) => {
  return (
    <section className="w-80 h-full bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary">Xử lý ngoại lệ</h2>
        {onCreateReport && (
          <button
            type="button"
            onClick={onCreateReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary"
          >
            <Plus className="w-3.5 h-3.5" /> Biên bản
          </button>
        )}
      </div>
      <div className="text-xs text-text-secondary bg-surface-subtle p-2 rounded-xl">
        Bãi A · {cases.length} trường hợp cần xử lý
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {cases.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={`p-3 rounded-xl border text-left transition-all min-h-16 ${
              selectedId === c.id
                ? 'border-surface-inverse bg-surface-subtle shadow-sm'
                : 'border-border-default hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <Badge variant={typeBadgeVariant[c.type]}>
                {typeLabel[c.type]}
              </Badge>
              <span className="text-xs text-text-secondary">{c.time}</span>
            </div>
            <div className="text-base font-bold text-text-primary mt-1">{c.plate}</div>
            <div className="text-xs text-text-secondary">{c.owner}</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-text-secondary">
        Bảo vệ ghi nhận ngoại lệ và lập biên bản xử lý tại trạm theo thẩm quyền.
      </p>
    </section>
  );
};
