import React, { useEffect, useMemo, useState } from 'react';
import { Search, ArrowLeft, RefreshCw, XCircle, Database, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Chip } from '../../../../components/ui/Chip';
import { extractApiError } from '../../../../api/client';
import type { ParkingSessionDto, StaffVehicleSearchResultDto } from '../../../../types/api';
import { searchApi } from '../api/searchApi';
import { SearchResultItem } from './SearchResultItem';
import { UserDetailCard } from './UserDetailCard';

interface VehicleSearchViewProps {
  vehicles: StaffVehicleSearchResultDto[];
  sessionHistory: ParkingSessionDto[];
  isLoading: boolean;
  dataError: string | null;
  onRefresh: () => void;
  onVerifyAtCheckpoint: (code: string) => void;
  onBackToCheckpoint: () => void;
}

type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'PARKED' | 'DENIED';

export const VehicleSearchView: React.FC<VehicleSearchViewProps> = ({
  vehicles,
  sessionHistory,
  isLoading,
  dataError,
  onRefresh,
  onVerifyAtCheckpoint,
  onBackToCheckpoint,
}) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<StaffVehicleSearchResultDto | null>(null);
  const [serverSearchState, setServerSearchState] = useState<{
    query: string;
    rows: StaffVehicleSearchResultDto[];
    error: string | null;
  } | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const trimmed = keyword.trim();

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setSelectedVehicle(null);
    if (!value.trim()) {
      setIsSearchingServer(false);
      setServerSearchState(null);
    } else {
      setIsSearchingServer(true);
    }
  };

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timerId = window.setTimeout(() => {
      searchApi
        .searchVehicles(trimmed, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) {
            setServerSearchState({ query: trimmed, rows, error: null });
          }
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setServerSearchState({
              query: trimmed,
              rows: [],
              error: extractApiError(err).message,
            });
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearchingServer(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [trimmed]);

  const baseVehicles = useMemo(() => {
    if (!trimmed) return vehicles;
    if (serverSearchState && serverSearchState.query === trimmed && !serverSearchState.error) {
      return serverSearchState.rows;
    }
    const clean = trimmed.toLowerCase();
    return vehicles.filter((v) =>
      `${v.licensePlate} ${v.ownerName} ${v.ownerCode} ${v.qrToken ?? ''} ${v.brand ?? ''} ${v.model ?? ''}`
        .toLowerCase()
        .includes(clean),
    );
  }, [serverSearchState, trimmed, vehicles]);

  const filteredVehicles = useMemo(() => {
    return baseVehicles.filter((v) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PARKED') return v.currentlyParked;
      if (statusFilter === 'DENIED') {
        return v.status === 'REJECTED' || v.status === 'CANCELED' || v.status === 'LOCKED';
      }
      return v.status === statusFilter;
    });
  }, [baseVehicles, statusFilter]);

  const activeVehicle = useMemo(() => {
    if (!selectedVehicle) return null;
    return (
      baseVehicles.find((v) => v.vehicleId === selectedVehicle.vehicleId) ??
      vehicles.find((v) => v.vehicleId === selectedVehicle.vehicleId) ??
      selectedVehicle
    );
  }, [baseVehicles, selectedVehicle, vehicles]);

  const selectedVehicleHistory = useMemo(() => {
    if (!activeVehicle) return [];
    return sessionHistory.filter((s) => s.vehicleId === activeVehicle.vehicleId);
  }, [activeVehicle, sessionHistory]);

  const activeError =
    dataError || (trimmed && serverSearchState?.query === trimmed ? serverSearchState.error : null);

  return (
    <main className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
      {/* Thanh tìm kiếm & Bộ lọc */}
      <section className="bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shrink-0 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {activeVehicle ? (
            <button
              type="button"
              onClick={() => setSelectedVehicle(null)}
              className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:opacity-75 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách ({filteredVehicles.length} xe)
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary">Tra cứu phương tiện</h2>
              <span className="flex items-center gap-1 text-xs font-semibold text-success-text bg-success-surface border border-success-border px-2.5 py-0.5 rounded-full">
                <Database className="w-3 h-3" /> {vehicles.length} xe từ DB
              </span>
              {isSearchingServer && (
                <span className="flex items-center gap-1 text-xs font-semibold text-info-text">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang truy vấn DB...
                </span>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="min-h-9 py-1.5 px-3 text-xs"
          >
            Tải lại DB
          </Button>
        </div>

        {!activeVehicle && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-surface-subtle border border-border-default rounded-full px-4 min-h-touch">
                <Search className="w-4 h-4 text-text-secondary shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="Tìm qua API theo biển số (59X3-682.45), MSSV/Mã CB (2311770), họ tên hoặc mã QR..."
                  className="bg-transparent text-text-primary text-sm font-bold w-full focus:outline-none"
                />
              </div>
              {keyword && (
                <Button variant="outline" onClick={() => handleKeywordChange('')}>
                  Xóa lọc
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Chip
                active={statusFilter === 'ALL'}
                label={`Tất cả (${baseVehicles.length})`}
                onClick={() => setStatusFilter('ALL')}
                className="min-h-9 py-1 px-3 text-xs"
              />
              <Chip
                active={statusFilter === 'APPROVED'}
                label={`Đã duyệt (${baseVehicles.filter((v) => v.status === 'APPROVED').length})`}
                onClick={() => setStatusFilter('APPROVED')}
                className="min-h-9 py-1 px-3 text-xs"
              />
              <Chip
                active={statusFilter === 'PARKED'}
                label={`Đang trong bãi (${baseVehicles.filter((v) => v.currentlyParked).length})`}
                onClick={() => setStatusFilter('PARKED')}
                className="min-h-9 py-1 px-3 text-xs"
              />
              <Chip
                active={statusFilter === 'PENDING'}
                label={`Chờ duyệt (${baseVehicles.filter((v) => v.status === 'PENDING').length})`}
                onClick={() => setStatusFilter('PENDING')}
                className="min-h-9 py-1 px-3 text-xs"
              />
              <Chip
                active={statusFilter === 'DENIED'}
                label={`Từ chối / Hủy (${baseVehicles.filter((v) => v.status === 'REJECTED' || v.status === 'CANCELED' || v.status === 'LOCKED').length})`}
                onClick={() => setStatusFilter('DENIED')}
                className="min-h-9 py-1 px-3 text-xs"
              />
            </div>
          </>
        )}
      </section>

      {activeError && (
        <div className="bg-danger-surface border border-danger-border text-danger-text p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shrink-0">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Không thể tải danh sách xe từ DB: {activeError}
          </span>
          <button type="button" onClick={onRefresh} className="underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {!activeVehicle ? (
        <section className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {isLoading && baseVehicles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm font-semibold text-text-secondary">
              Đang đọc danh sách phương tiện từ cơ sở dữ liệu...
            </div>
          ) : filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <SearchResultItem
                key={vehicle.vehicleId}
                vehicle={vehicle}
                onViewDetail={setSelectedVehicle}
                onVerifyAtCheckpoint={onVerifyAtCheckpoint}
              />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary">
              <XCircle className="w-10 h-10 opacity-30" />
              <span className="text-sm font-semibold">
                {baseVehicles.length === 0
                  ? 'Không tìm thấy phương tiện nào khớp trong cơ sở dữ liệu'
                  : 'Không tìm thấy phương tiện khớp bộ lọc trạng thái'}
              </span>
              {(keyword || statusFilter !== 'ALL') && (
                <span className="text-xs">Thử xóa từ khóa hoặc chuyển bộ lọc sang "Tất cả".</span>
              )}
            </div>
          )}
        </section>
      ) : (
        <UserDetailCard
          vehicle={activeVehicle}
          history={selectedVehicleHistory}
          onVerifyAtCheckpoint={onVerifyAtCheckpoint}
        />
      )}

      <footer className="min-h-12 py-2 bg-surface-card border border-border-muted rounded-2xl px-4 flex items-center justify-between gap-2 flex-wrap shrink-0 shadow-sm">
        <Button variant="subtle" onClick={onBackToCheckpoint} className="min-h-9 py-1.5 text-xs">
          ← Về Trạm kiểm soát
        </Button>
        <div className="text-xs text-text-secondary">
          Truy vấn trực tiếp <code>GET /api/v1/staff/vehicles/search</code>
        </div>
      </footer>
    </main>
  );
};
