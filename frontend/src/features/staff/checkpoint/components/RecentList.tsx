import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Car } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Chip } from '../../../../components/ui/Chip';
import { Badge } from '../../../../components/ui/Badge';
import type { ParkingLotDto, ParkingSessionDto } from '../../../../types/api';
import { formatDuration, formatTimeOnly } from '../../utils/formatters';

interface RecentListProps {
  activeSessions: ParkingSessionDto[];
  sessionHistory: ParkingSessionDto[];
  selectedLot: ParkingLotDto | undefined;
  onSelectForVerify: (code: string) => void;
}

export const RecentList: React.FC<RecentListProps> = ({
  activeSessions,
  sessionHistory,
  selectedLot,
  onSelectForVerify,
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [lotScope, setLotScope] = useState<'all' | 'current'>('all');

  const filteredActive = useMemo(() => {
    const base =
      lotScope === 'current' && selectedLot
        ? activeSessions.filter((s) => s.parkingLotId === selectedLot.id)
        : activeSessions;
    return [...base].sort((a, b) => {
      const aMatch = selectedLot && a.parkingLotId === selectedLot.id ? 0 : 1;
      const bMatch = selectedLot && b.parkingLotId === selectedLot.id ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [activeSessions, lotScope, selectedLot]);

  const filteredHistory = useMemo(() => {
    const base =
      lotScope === 'current' && selectedLot
        ? sessionHistory.filter((s) => s.parkingLotId === selectedLot.id)
        : sessionHistory;
    return base.slice(0, 10);
  }, [lotScope, selectedLot, sessionHistory]);

  const rows = viewMode === 'active' ? filteredActive : filteredHistory;

  return (
    <Card
      headerTitle={viewMode === 'active' ? 'Xe đang gửi trong bãi' : 'Lịch sử ra/vào gần nhất'}
      headerRight={
        <span className="text-xs font-semibold text-text-secondary">
          {viewMode === 'active' ? `${filteredActive.length} xe` : `${filteredHistory.length} lượt`}
        </span>
      }
      className="flex-1 min-h-0"
    >
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        <Chip
          active={viewMode === 'active'}
          label={`Đang gửi (${filteredActive.length})`}
          onClick={() => setViewMode('active')}
          className="min-h-8 py-1 px-2.5 text-xs"
        />
        <Chip
          active={viewMode === 'history'}
          label="Gần nhất"
          onClick={() => setViewMode('history')}
          className="min-h-8 py-1 px-2.5 text-xs"
        />
        {selectedLot && (
          <Chip
            active={lotScope === 'current'}
            label={`Chỉ ${selectedLot.code}`}
            onClick={() => setLotScope((s) => (s === 'all' ? 'current' : 'all'))}
            className="min-h-8 py-1 px-2.5 text-xs ml-auto"
          />
        )}
      </div>

      <div className="flex flex-col divide-y divide-border-subtle overflow-y-auto flex-1 pr-1">
        {rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-secondary">
            {viewMode === 'active'
              ? 'Không có xe nào đang gửi trong phạm vi đang lọc.'
              : 'Chưa có lượt vào/ra nào trong phạm vi đang lọc.'}
          </div>
        ) : (
          rows.map((session) => {
            const isActive = session.status === 'ACTIVE';
            const timeText = isActive
              ? formatTimeOnly(session.checkinTime)
              : formatTimeOnly(session.checkoutTime || session.checkinTime);

            return (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => onSelectForVerify(session.licensePlate)}
                title="Nhấn để kiểm tra / xác nhận tại Trạm"
                className="py-2 px-1.5 -mx-1.5 rounded-lg flex items-center justify-between gap-2 text-left hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-warning-surface text-warning-text'
                        : 'bg-success-surface text-success-text'
                    }`}
                  >
                    {isActive ? (
                      <Car className="w-3.5 h-3.5" />
                    ) : session.checkoutTime ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-primary">{session.licensePlate}</span>
                      <Badge variant={isActive ? 'warning' : 'success'} className="text-[10px] px-1.5 py-0">
                        {isActive ? 'Trong bãi' : 'Đã ra'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-text-secondary truncate">
                      {session.ownerName} · {session.parkingLotCode}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-semibold text-text-primary">{timeText}</div>
                  <div className="text-[10px] text-text-secondary">
                    {isActive ? formatDuration(session.checkinTime) : 'Nhấn kiểm tra'}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
};
