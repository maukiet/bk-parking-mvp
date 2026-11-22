import React, { useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Chip } from '../../../../components/ui/Chip';

export interface HistoryItem {
  time: string;
  action: 'Vào' | 'Ra';
  lot: string;
}

interface UserHistorySectionProps {
  history: HistoryItem[];
}

export const UserHistorySection: React.FC<UserHistorySectionProps> = ({ history }) => {
  const [actionFilter, setActionFilter] = useState<'all' | 'in' | 'out'>('all');
  const [lotFilter, setLotFilter] = useState<string>('all');

  // Lấy danh sách các bãi độc nhất từ lịch sử
  const availableLots = Array.from(new Set(history.map((h) => h.lot)));

  const filteredHistory = history.filter((item) => {
    const matchAction =
      actionFilter === 'all' ||
      (actionFilter === 'in' && item.action === 'Vào') ||
      (actionFilter === 'out' && item.action === 'Ra');

    const matchLot = lotFilter === 'all' || item.lot === lotFilter;

    return matchAction && matchLot;
  });

  return (
    <section className="bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 flex-1 overflow-hidden shadow-sm">
      {/* Tiêu đề & Bộ lọc */}
      <div className="flex flex-col gap-2 shrink-0 border-b border-border-subtle pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <History className="w-4 h-4 text-text-secondary" />
            Lịch sử vào / ra ({filteredHistory.length} / {history.length} lượt)
          </h3>
          <span className="text-xs text-text-secondary">Dữ liệu ghi nhận từ các trạm kiểm soát</span>
        </div>

        {/* Thanh chip bộ lọc */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-secondary mr-1">Lọc theo:</span>
          <Chip active={actionFilter === 'all'} label="Tất cả" onClick={() => setActionFilter('all')} />
          <Chip active={actionFilter === 'in'} label="Lượt vào" onClick={() => setActionFilter('in')} />
          <Chip active={actionFilter === 'out'} label="Lượt ra" onClick={() => setActionFilter('out')} />

          {availableLots.length > 1 && (
            <>
              <span className="text-border-default mx-1">|</span>
              <Chip active={lotFilter === 'all'} label="Tất cả bãi" onClick={() => setLotFilter('all')} />
              {availableLots.map((lot) => (
                <Chip
                  key={lot}
                  active={lotFilter === lot}
                  label={lot}
                  onClick={() => setLotFilter(lotFilter === lot ? 'all' : lot)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Danh sách lịch sử cuộn dọc */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col divide-y divide-border-subtle">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => {
            const isEntry = item.action === 'Vào';
            return (
              <div key={index} className="py-2.5 flex items-center justify-between hover:bg-surface-subtle px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isEntry ? 'bg-success-surface text-success' : 'bg-info-surface text-info'
                    }`}
                  >
                    {isEntry ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">
                        {item.action === 'Vào' ? 'Lượt VÀO cổng' : 'Lượt RA cổng'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary border border-border-default">
                        {item.lot}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary mt-0.5 block">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={isEntry ? 'success' : 'info'}>
                    {isEntry ? 'Đã vào bãi' : 'Đã rời bãi'}
                  </Badge>
                  <span className="text-xs text-text-secondary font-medium">Tự động</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-text-secondary gap-1">
            <span className="text-sm font-semibold">Không có lượt vào/ra nào phù hợp bộ lọc</span>
            <span className="text-xs">Thử chọn bộ lọc "Tất cả" để xem toàn bộ lịch sử</span>
          </div>
        )}
      </div>
    </section>
  );
};

