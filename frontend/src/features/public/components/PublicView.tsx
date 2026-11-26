import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Clock, LogIn, Monitor, RefreshCw } from 'lucide-react';
import { extractApiError } from '../../../api/client';
import type { PublicParkingLotsResponse } from '../../../types/api';
import { publicApi } from '../api/publicApi';
import { ParkingLotCard } from './ParkingLotCard';

const PUBLIC_POLL_INTERVAL_MS = 10000;

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const PublicView: React.FC = () => {
  const [overview, setOverview] = useState<PublicParkingLotsResponse | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const syncFromServer = () => {
      publicApi
        .getPublicOverview(controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setOverview(data);
          setLastRefreshed(formatCurrentTime());
          setError(null);
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setError(extractApiError(err).message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        });
    };

    syncFromServer();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFromServer();
      }
    }, PUBLIC_POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromServer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshTick]);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshTick((tick) => tick + 1);
  };

  const lots = overview?.parkingLots ?? [];
  const totalCapacity =
    overview?.totalCapacity ?? lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const totalOccupied =
    overview?.totalOccupied ?? lots.reduce((sum, lot) => sum + lot.occupiedCount, 0);
  const totalAvailable =
    overview?.totalAvailable ??
    lots.reduce(
      (acc, cur) => acc + (cur.availableSlots ?? Math.max(0, cur.capacity - cur.occupiedCount)),
      0,
    );

  return (
    <div className="min-h-dvh w-full bg-surface-app flex flex-col justify-between p-4 sm:p-6 gap-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-surface-inverse text-text-inverse font-bold text-2xl flex items-center justify-center shrink-0">
            P
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary">
                Bảng điện tử số chỗ trống bãi đỗ xe
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-surface text-success-text border border-success-border flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Trực tiếp (10s)
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              ĐHBK HCMUT · Kiosk công khai ngoài cổng &amp; Kiosk tra cứu điện tử
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-left sm:text-right">
            <div className="text-base font-bold text-text-primary">
              Toàn trường: còn {totalAvailable} / {totalCapacity} chỗ
            </div>
            <div className="text-xs text-text-secondary flex items-center gap-1.5 sm:justify-end flex-wrap">
              <span>
                Đang gửi: <strong className="text-text-primary">{totalOccupied}</strong> xe
              </span>
              {lastRefreshed && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {lastRefreshed}
                  </span>
                </>
              )}
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-border-default hover:bg-surface-subtle text-xs font-bold text-text-primary shrink-0"
          >
            <LogIn className="w-4 h-4" /> Đăng nhập
          </Link>
        </div>
      </header>

      {/* Danh sách bãi */}
      <main className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-text-secondary">
            Tình trạng thời gian thực tại các phân khu bãi đỗ xe ({lots.length} bãi)
          </span>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-danger-surface border border-danger-border text-danger-text rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
              <span>
                Không thể đồng bộ dữ liệu bãi đỗ xe từ Backend: <strong>{error}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3 py-1.5 rounded-lg bg-surface-card border border-danger-border font-bold text-danger-text hover:bg-surface-subtle cursor-pointer shrink-0"
            >
              Thử lại
            </button>
          </div>
        )}

        {isLoading && lots.length === 0 ? (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 rounded-3xl bg-surface-card border border-border-default animate-pulse p-5"
              />
            ))}
          </div>
        ) : lots.length === 0 ? (
          <div className="bg-surface-card border border-border-default rounded-3xl p-8 text-center text-sm text-text-secondary">
            Chưa có dữ liệu bãi đỗ xe từ hệ thống.
          </div>
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
            {lots.map((lot) => (
              <ParkingLotCard key={lot.id} lot={lot} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border-subtle pt-3 flex items-center justify-between gap-3 text-xs text-text-secondary flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <span>Ngưỡng trạng thái:</span>
          <span className="text-success-text font-bold">● Còn nhiều (&lt; 70%)</span>
          <span className="text-warning-text font-bold">● Sắp đầy (70–90%)</span>
          <span className="text-danger font-bold">● Gần đầy (&gt; 90%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-text-muted shrink-0" /> Chế độ Kiosk điện tử tự động cập nhật
        </div>
      </footer>
    </div>
  );
};
