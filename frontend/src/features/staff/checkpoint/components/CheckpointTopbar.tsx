import React, { useState, useEffect } from 'react';
import { Clock, Database, MapPin, RefreshCw, AlertCircle, UserCheck } from 'lucide-react';
import type { ParkingLotDto, UserInfo } from '../../../../types/api';

interface CheckpointTopbarProps {
  lots: ParkingLotDto[];
  selectedLot: ParkingLotDto | undefined;
  onSelectLot: (lotId: number) => void;
  staffUser: UserInfo | null;
  isLoadingData: boolean;
  dataError: string | null;
  lastSyncedAt: string;
  onRefresh: () => void;
}

function getStoredUserFallback(): UserInfo | null {
  try {
    const raw = localStorage.getItem('bk_user');
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

export const CheckpointTopbar: React.FC<CheckpointTopbarProps> = ({
  lots,
  selectedLot,
  onSelectLot,
  staffUser,
  isLoadingData,
  dataError,
  lastSyncedAt,
  onRefresh,
}) => {
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentGuard = staffUser ?? getStoredUserFallback();

  return (
    <header className="min-h-16 py-2 w-full bg-surface-card border-b border-border-default flex items-center justify-between gap-3 px-4 sm:px-5 shrink-0 select-none flex-wrap">
      {/* Bãi đang trực + Thông tin nhân viên đang đăng nhập */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="staff-lot-select" className="text-xs font-semibold text-text-secondary shrink-0">
              Trạm trực:
            </label>
            <select
              id="staff-lot-select"
              value={selectedLot?.id ?? ''}
              onChange={(e) => onSelectLot(Number(e.target.value))}
              disabled={lots.length === 0}
              className="text-sm font-bold text-text-primary bg-surface-subtle border border-border-default rounded-lg px-2.5 py-1 focus:outline-none truncate max-w-[260px] sm:max-w-xs cursor-pointer"
            >
              {lots.length === 0 ? (
                <option value="">Đang tải danh sách bãi...</option>
              ) : (
                lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} ({lot.occupiedCount}/{lot.capacity} xe)
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5 truncate">
            <UserCheck className="w-3.5 h-3.5 text-success shrink-0" />
            <span>
              Bảo vệ: <strong className="text-text-primary">{currentGuard?.fullName ?? 'Nhân viên trực'}</strong>
              {currentGuard?.code ? ` · Mã ${currentGuard.code}` : ''}
            </span>
          </p>
        </div>
      </div>

      {/* Trạng thái đồng bộ DB thực & Giờ hệ thống */}
      <div className="flex items-center gap-3 flex-wrap ml-auto">
        <div className="flex items-center gap-2 shrink-0">
          {dataError ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-danger-surface text-danger-text border border-danger-border">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Lỗi kết nối CSDL
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-success-surface text-success-text border border-success-border">
              <Database className="w-3.5 h-3.5 shrink-0" />
              {isLoadingData
                ? 'Đang đồng bộ...'
                : lastSyncedAt
                  ? `Đồng bộ DB (${lastSyncedAt})`
                  : 'Kết nối DB thực'}
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-text-primary disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-base font-bold text-text-primary tabular-nums">{currentTime}</div>
          <div className="text-xs text-text-secondary flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" /> Giờ hệ thống
          </div>
        </div>
      </div>
    </header>
  );
};
