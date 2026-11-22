import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

interface ShiftTasksAndAlertsProps {
  onGoToException: () => void;
  onGoToCheckpoint: () => void;
}

export const ShiftTasksAndAlerts: React.FC<ShiftTasksAndAlertsProps> = ({
  onGoToException,
  onGoToCheckpoint,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Việc cần giải quyết tại trạm Bãi A */}
      <Card headerTitle="Việc cần giải quyết tại trạm (Bãi A)" className="p-3 justify-between">
        <div className="flex flex-col divide-y divide-border-subtle text-xs">
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-bold text-text-primary">3 vụ ngoại lệ cần xử lý tại chỗ</span>
              <div className="text-[11px] text-text-secondary">Thiếu lượt vào, mất thẻ khách, lệch biển số</div>
            </div>
            <button
              type="button"
              onClick={onGoToException}
              className="px-3 py-1.5 rounded-lg bg-surface-inverse text-text-inverse text-[11px] font-bold hover:opacity-90 flex items-center gap-1"
            >
              Xử lý <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-bold text-text-primary">1 xe khách vãng lai chờ thu hồi thẻ</span>
              <div className="text-[11px] text-text-secondary">Biển số 59F1-628.30 · Thu hồi thẻ #V088 tại cổng ra</div>
            </div>
            <button
              type="button"
              onClick={onGoToCheckpoint}
              className="px-3 py-1.5 rounded-lg bg-info text-text-inverse text-[11px] font-bold hover:bg-info-hover flex items-center gap-1"
            >
              Thu thẻ <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </Card>

      {/* Cảnh báo an ninh ca trực tại Bãi A */}
      <Card headerTitle="Cảnh báo an ninh ca trực (Bãi A)" className="p-3 justify-between">
        <div className="flex flex-col gap-2 text-xs">
          <div className="bg-warning-surface border border-warning-border p-2.5 rounded-xl flex items-center justify-between text-warning-text">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-bold">Lối ra Bãi A có xe đỗ chắn</div>
                <div className="text-[10px] text-text-secondary">07:40 · Ưu tiên nhắc nhở di dời</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-card border border-warning-border text-text-primary">
              Cần xử lý
            </span>
          </div>

          <div className="bg-surface-subtle p-2 rounded-xl flex items-center justify-between text-[11px] text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Ca trực bắt đầu lúc 06:00 · Đã trực 1 giờ 45 phút
            </span>
            <span className="font-bold text-success-text">Hệ thống đồng bộ tốt</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

