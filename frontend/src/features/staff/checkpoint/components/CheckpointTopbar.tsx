import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Volume2, HelpCircle, LogOut } from 'lucide-react';

interface CheckpointTopbarProps {
  isOffline: boolean;
  onToggleOffline: () => void;
  onEndShiftClick: () => void;
  syncQueueCount: number;
}

export const CheckpointTopbar: React.FC<CheckpointTopbarProps> = ({
  isOffline,
  onToggleOffline,
  onEndShiftClick,
  syncQueueCount,
}) => {
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-topbar w-full bg-surface-card border-b border-border-default flex items-center justify-between px-6 shrink-0 select-none">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Cổng Lý Thường Kiệt – Bãi A</h1>
        <p className="text-xs text-text-secondary">Ca sáng 06:00–14:00 · Nguyễn Văn B</p>
      </div>

      {/* Trạng thái kết nối & Chế độ Offline */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            isOffline
              ? 'bg-warning-surface text-warning-text border-warning-border'
              : 'bg-success-surface text-success-text border-success-border'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" /> Ngoại tuyến ({syncQueueCount} chờ đồng bộ)
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" /> Trực tuyến (Sẵn sàng)
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-base font-bold text-text-primary">{currentTime}</div>
          <div className="text-xs text-text-secondary flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" /> Giờ hệ thống
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="p-2 rounded-full border border-border-default hover:bg-surface-subtle">
            <Volume2 className="w-4 h-4 text-text-secondary" />
          </button>
          <button type="button" className="p-2 rounded-full border border-border-default hover:bg-surface-subtle">
            <HelpCircle className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            type="button"
            onClick={onEndShiftClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-danger-border text-danger font-semibold text-xs hover:bg-danger-surface"
          >
            <LogOut className="w-3.5 h-3.5" /> Kết thúc ca
          </button>
        </div>
      </div>
    </header>
  );
};
