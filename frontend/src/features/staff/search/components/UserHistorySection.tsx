import React, { useState } from 'react';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Chip } from '../../../../components/ui/Chip';
import type { ParkingSessionDto } from '../../../../types/api';
import { formatDateTime, formatDuration } from '../../utils/formatters';

interface UserHistorySectionProps {
  history: ParkingSessionDto[];
}

export const UserHistorySection: React.FC<UserHistorySectionProps> = ({ history }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'COMPLETED'>('all');

  const filtered = history.filter((item) =>
    statusFilter === 'all' ? true : item.status === statusFilter,
  );

  return (
    <section className="bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 flex-1 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border-subtle pb-3 shrink-0">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <History className="w-4 h-4 text-text-secondary" />
          Lịch sử lượt gửi xe từ DB ({filtered.length} / {history.length} phiên)
        </h3>
        <div className="flex items-center gap-1.5">
          <Chip
            active={statusFilter === 'all'}
            label="Tất cả"
            onClick={() => setStatusFilter('all')}
            className="min-h-8 py-1 px-3 text-xs"
          />
          <Chip
            active={statusFilter === 'ACTIVE'}
            label="Đang gửi"
            onClick={() => setStatusFilter('ACTIVE')}
            className="min-h-8 py-1 px-3 text-xs"
          />
          <Chip
            active={statusFilter === 'COMPLETED'}
            label="Đã ra"
            onClick={() => setStatusFilter('COMPLETED')}
            className="min-h-8 py-1 px-3 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col divide-y divide-border-subtle">
        {filtered.length > 0 ? (
          filtered.map((session) => {
            const isActive = session.status === 'ACTIVE';
            return (
              <div
                key={session.sessionId}
                className="py-2.5 flex items-center justify-between gap-3 px-2 rounded-lg hover:bg-surface-subtle"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-warning-surface text-warning-text' : 'bg-success-surface text-success'
                    }`}
                  >
                    {isActive ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary">
                        {session.parkingLotName}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Vào: {session.entryGate || '—'}
                        {session.exitGate ? ` → Ra: ${session.exitGate}` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      Vào lúc: <strong>{formatDateTime(session.checkinTime)}</strong>
                      {session.checkoutTime && (
                        <> · Ra lúc: <strong>{formatDateTime(session.checkoutTime)}</strong></>
                      )}
                      {' · '}Thời lượng: <strong>{formatDuration(session.checkinTime, session.checkoutTime)}</strong>
                    </div>
                    {(session.checkinStaffName || session.checkoutStaffName || session.note) && (
                      <div className="text-[11px] text-text-secondary mt-0.5 flex flex-wrap gap-2">
                        {session.checkinStaffName && <span>BV vào: {session.checkinStaffName}</span>}
                        {session.checkoutStaffName && <span>· BV ra: {session.checkoutStaffName}</span>}
                        {session.note && <span>· Ghi chú: {session.note}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <Badge variant={isActive ? 'warning' : 'success'}>
                  {isActive ? 'Đang gửi' : 'Hoàn tất'}
                </Badge>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-text-secondary gap-1">
            <span className="text-sm font-semibold">Chưa có lịch sử gửi xe nào trong DB</span>
            <span className="text-xs">Xe chưa thực hiện lượt check-in / check-out nào.</span>
          </div>
        )}
      </div>
    </section>
  );
};
