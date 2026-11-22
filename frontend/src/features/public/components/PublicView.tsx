import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { RefreshCw, LogIn, Clock, Monitor } from 'lucide-react';
import { publicApi } from '../api/publicApi';
import type { ParkingLotDto } from '../../../types/api';
import { ParkingLotCard } from './ParkingLotCard';

export const PublicView: React.FC = () => {
  const [lots, setLots] = useState<ParkingLotDto[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetchLots = () => {
    publicApi.getParkingLots().then((data) => {
      setLots(data);
      setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
    });
  };

  useEffect(() => {
    fetchLots();
    const interval = setInterval(fetchLots, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAvailable = lots.reduce(
    (acc, cur) => acc + (cur.availableSlots ?? Math.max(0, cur.capacity - cur.occupiedCount)),
    0
  );

  return (
    <div className="min-h-screen w-full bg-surface-app flex flex-col justify-between p-6 select-none">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-surface-inverse text-text-inverse font-bold text-2xl flex items-center justify-center">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">Bảng điện tử số chỗ trống bãi đỗ xe</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-surface text-success-text border border-success-border flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Trực tiếp (10s)
              </span>
            </div>
            <p className="text-xs text-text-secondary">ĐHBK HCMUT · Kiosk công khai ngoài cổng &amp; Kiosk tra cứu điện tử</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-base font-bold text-text-primary">Toàn trường: còn {totalAvailable} chỗ</div>
            <div className="text-xs text-text-secondary flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" /> Cập nhật lúc {lastRefreshed}
            </div>
          </div>
          <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-border-default hover:bg-surface-subtle text-xs font-bold text-text-primary">
            <LogIn className="w-4 h-4" /> Đăng nhập
          </Link>
        </div>
      </header>

      {/* Danh sách bãi */}
      <main className="flex-1 my-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary">
            Tình trạng thời gian thực tại các phân khu bãi đỗ xe ({lots.length} bãi)
          </span>

          <button type="button" onClick={fetchLots} className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {lots.map((lot) => (
            <ParkingLotCard key={lot.id} lot={lot} />
          ))}
        </div>
      </main>

      <footer className="border-t border-border-subtle pt-3 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-4">
          <span>Ngưỡng trạng thái:</span>
          <span className="text-success-text font-bold">● Còn nhiều (&lt; 70%)</span>
          <span className="text-warning-text font-bold">● Sắp đầy (70–90%)</span>
          <span className="text-danger font-bold">● Gần đầy (&gt; 90%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-text-muted" /> Chế độ Kiosk điện tử tự động cập nhật
        </div>
      </footer>
    </div>
  );
};
