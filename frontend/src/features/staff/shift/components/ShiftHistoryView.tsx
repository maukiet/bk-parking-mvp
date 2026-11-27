import React, { useMemo, useState } from 'react';
import { RefreshCw, Search, ArrowDownRight, ArrowUpRight, Database } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Chip } from '../../../../components/ui/Chip';
import type { ParkingLotDto, ParkingSessionDto } from '../../../../types/api';
import { formatTimeOnly, isSameLocalDate } from '../../utils/formatters';
import { ShiftDetailCard } from './ShiftDetailCard';

interface ShiftHistoryViewProps {
  lots: ParkingLotDto[];
  selectedLotId: number;
  activeSessions: ParkingSessionDto[];
  sessionHistory: ParkingSessionDto[];
  isLoading: boolean;
  onRefresh: () => void;
  onVerifyAtCheckpoint: (code: string) => void;
}

type DateFilter = 'ALL' | 'TODAY' | '7DAYS';

function matchesDateWindow(iso: string | null | undefined, filter: DateFilter): boolean {
  if (filter === 'ALL') return true;
  if (!iso) return false;
  if (filter === 'TODAY') return isSameLocalDate(iso);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

export const ShiftHistoryView: React.FC<ShiftHistoryViewProps> = ({
  lots,
  selectedLotId,
  activeSessions,
  sessionHistory,
  isLoading,
  onRefresh,
  onVerifyAtCheckpoint,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [lotFilter, setLotFilter] = useState<number | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const filteredSessions = useMemo(() => {
    const clean = keyword.trim().toLowerCase();
    const base = statusFilter === 'ACTIVE' ? activeSessions : sessionHistory;
    return base.filter((s) => {
      if (statusFilter === 'COMPLETED' && s.status !== 'COMPLETED') return false;
      if (!matchesDateWindow(s.checkinTime, dateFilter)) return false;
      if (lotFilter !== 'ALL' && s.parkingLotId !== lotFilter) return false;
      if (!clean) return true;
      return `${s.licensePlate} ${s.ownerName} ${s.ownerCode} ${s.parkingLotName} ${s.checkinStaffName ?? ''} ${s.checkoutStaffName ?? ''}`
        .toLowerCase()
        .includes(clean);
    });
  }, [activeSessions, dateFilter, keyword, lotFilter, sessionHistory, statusFilter]);

  const filteredActiveCount = useMemo(
    () => filteredSessions.filter((s) => s.status === 'ACTIVE').length,
    [filteredSessions],
  );
  const filteredCompletedCount = filteredSessions.length - filteredActiveCount;

  const currentSession = useMemo(() => {
    if (filteredSessions.length === 0) return undefined;
    return (
      filteredSessions.find((s) => s.sessionId === selectedSessionId) ?? filteredSessions[0]
    );
  }, [filteredSessions, selectedSessionId]);

  return (
    <main className="flex-1 p-3 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden">
      {/* Cột trái: Danh sách lượt vào/ra thật từ DB */}
      <section className="w-full lg:w-[430px] lg:h-full bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-1.5">
              Nhật ký vào/ra &amp; Xe trong bãi
            </h2>
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <Database className="w-3 h-3 text-success" />
              Đang lọc: {filteredSessions.length} lượt ({filteredActiveCount} đang đỗ · {filteredCompletedCount} đã ra)
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="min-h-8 py-1 px-2.5 text-xs"
          >
            Làm mới
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-surface-subtle border border-border-default rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-text-secondary shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm biển số, chủ xe, MSSV, bảo vệ..."
            className="bg-transparent text-xs font-semibold text-text-primary w-full focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip
            active={statusFilter === 'ALL'}
            label={`Tất cả (${sessionHistory.length})`}
            onClick={() => setStatusFilter('ALL')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
          <Chip
            active={statusFilter === 'ACTIVE'}
            label={`Đang đỗ (${activeSessions.length})`}
            onClick={() => setStatusFilter('ACTIVE')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
          <Chip
            active={statusFilter === 'COMPLETED'}
            label="Đã ra"
            onClick={() => setStatusFilter('COMPLETED')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip
            active={dateFilter === 'ALL'}
            label="Mọi ngày"
            onClick={() => setDateFilter('ALL')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
          <Chip
            active={dateFilter === 'TODAY'}
            label="Hôm nay"
            onClick={() => setDateFilter('TODAY')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
          <Chip
            active={dateFilter === '7DAYS'}
            label="7 ngày"
            onClick={() => setDateFilter('7DAYS')}
            className="min-h-8 py-1 px-2.5 text-xs"
          />
        </div>

        <select
          aria-label="Lọc theo bãi đỗ xe"
          value={lotFilter}
          onChange={(e) => {
            const val = e.target.value;
            setLotFilter(val === 'ALL' ? 'ALL' : Number(val));
          }}
          className="text-xs font-semibold bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-text-primary focus:outline-none cursor-pointer"
        >
          <option value="ALL">Tất cả 5 bãi đỗ xe</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.name} {lot.id === selectedLotId ? '(Đang trực)' : ''}
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] lg:max-h-none lg:flex-1 pr-1">
          {filteredSessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-text-secondary">
              Không có phiên gửi xe nào khớp bộ lọc.
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.status === 'ACTIVE';
              const isSelected = currentSession?.sessionId === s.sessionId;
              return (
                <button
                  key={s.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(s.sessionId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-surface-inverse bg-surface-subtle shadow-sm'
                      : 'border-border-default hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-text-primary">{s.licensePlate}</span>
                    <Badge variant={isActive ? 'warning' : 'success'}>
                      {isActive ? 'Đang gửi' : 'Đã ra'}
                    </Badge>
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5 truncate">
                    {s.ownerName} ({s.ownerCode}) · {s.parkingLotCode}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1.5">
                    <span className="flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-success" />
                      Vào {formatTimeOnly(s.checkinTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-info" />
                      {s.checkoutTime ? `Ra ${formatTimeOnly(s.checkoutTime)}` : 'Chưa ra'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Cột phải: Chi tiết phiên được chọn */}
      <section className="flex-1 lg:h-full overflow-hidden">
        <ShiftDetailCard session={currentSession} onVerifyAtCheckpoint={onVerifyAtCheckpoint} />
      </section>
    </main>
  );
};
