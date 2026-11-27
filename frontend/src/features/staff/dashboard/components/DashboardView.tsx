import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Car,
  CheckCircle2,
  Database,
  History,
  RefreshCw,
  ScanLine,
  Search,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import type {
  ParkingLotDto,
  ParkingSessionDto,
  StaffVehicleSearchResultDto,
  UserInfo,
} from '../../../../types/api';
import {
  formatAllowedVehicleTypes,
  formatDuration,
  formatTimeOnly,
  getLotStatusDisplay,
  isSameLocalDate,
} from '../../utils/formatters';

interface DashboardViewProps {
  lots: ParkingLotDto[];
  selectedLot: ParkingLotDto | undefined;
  activeSessions: ParkingSessionDto[];
  sessionHistory: ParkingSessionDto[];
  vehicles: StaffVehicleSearchResultDto[];
  staffUser: UserInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLot: (lotId: number) => void;
  onGoToCheckpoint: () => void;
  onGoToSearch: () => void;
  onGoToHistory: () => void;
  onVerifyAtCheckpoint: (code: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lots,
  selectedLot,
  activeSessions,
  sessionHistory,
  vehicles,
  staffUser,
  isLoading,
  onRefresh,
  onSelectLot,
  onGoToCheckpoint,
  onGoToSearch,
  onGoToHistory,
  onVerifyAtCheckpoint,
}) => {
  const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  const totalOccupied = lots.reduce((sum, lot) => sum + lot.occupiedCount, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const overallRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const completedCount = sessionHistory.filter((s) => s.status === 'COMPLETED').length;
  const todayCount = sessionHistory.filter((s) => isSameLocalDate(s.checkinTime)).length;
  const approvedVehicles = vehicles.filter((v) => v.status === 'APPROVED').length;
  const pendingVehicles = vehicles.filter((v) => v.status === 'PENDING').length;

  const selectedLotAvailable = selectedLot
    ? (selectedLot.availableSlots ?? Math.max(0, selectedLot.capacity - selectedLot.occupiedCount))
    : 0;
  const selectedLotRate = selectedLot?.occupancyRate ?? 0;

  return (
    <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-surface-app">
      {/* Header */}
      <section className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2 flex-wrap">
            Tổng quan vận hành trạm bảo vệ
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" /> Số liệu DB thực
              </span>
            </Badge>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Bảo vệ trực: <strong className="text-text-primary">{staffUser?.fullName ?? 'Nhân viên trực'}</strong>
            {selectedLot ? ` · Trạm đang chọn: ${selectedLot.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            className="min-h-10 py-1.5 px-4 text-xs"
          >
            Làm mới DB
          </Button>
          <Button
            variant="inverse"
            onClick={onGoToCheckpoint}
            icon={<ScanLine className="w-4 h-4" />}
            className="min-h-10 py-1.5 px-4 text-xs"
          >
            Về Trạm kiểm soát
          </Button>
        </div>
      </section>

      {/* 4 KPI thực tế từ DB */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Bãi đang trực ({selectedLot?.code ?? '—'})</span>
            <Car className="w-4 h-4 text-text-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1">
            còn {selectedLotAvailable} <span className="text-xs font-normal text-text-secondary">chỗ</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Đang gửi: <strong>{selectedLot?.occupiedCount ?? 0}</strong> / {selectedLot?.capacity ?? 0} ({selectedLotRate}%)
          </div>
          <ProgressBar value={selectedLotRate} className="mt-1.5" />
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Toàn trường ({lots.length} bãi)</span>
            <Building2 className="w-4 h-4 text-text-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1">
            còn {totalAvailable} <span className="text-xs font-normal text-text-secondary">/ {totalCapacity} chỗ</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Tổng đang đỗ: <strong>{totalOccupied}</strong> xe ({overallRate}%)
          </div>
          <ProgressBar value={overallRate} className="mt-1.5" />
        </Card>

        <Card className="p-3.5 bg-info-surface border-info-border">
          <div className="flex items-center justify-between text-xs font-bold text-info-text">
            <span>Phiên gửi xe trong DB</span>
            <History className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-info-text mt-1">
            {activeSessions.length} <span className="text-xs font-normal">đang gửi</span> · {completedCount}{' '}
            <span className="text-xs font-normal">đã ra</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Tổng {sessionHistory.length} lượt ghi nhận ({todayCount} lượt hôm nay)
          </div>
        </Card>

        <Card className="p-3.5 bg-success-surface border-success-border">
          <div className="flex items-center justify-between text-xs font-bold text-success-text">
            <span>Phương tiện đăng ký (DB)</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-success-text mt-1">
            {vehicles.length} <span className="text-xs font-normal">xe</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {approvedVehicles} đã duyệt · {pendingVehicles} chờ Admin duyệt
          </div>
          <button
            type="button"
            onClick={onGoToSearch}
            className="text-xs font-bold text-success-text hover:underline text-left mt-0.5 cursor-pointer flex items-center gap-1"
          >
            <Search className="w-3 h-3" /> Mở danh sách tra cứu →
          </button>
        </Card>
      </section>

      {/* Hiện trạng 5 bãi từ DB */}
      <Card
        headerTitle="Hiện trạng 5 bãi đỗ xe toàn trường (Nhấn vào bãi để đặt làm trạm trực)"
        headerRight={
          <span className="text-xs text-text-secondary">Đồng bộ với Public View &amp; Admin</span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {lots.map((lot) => {
            const isSelected = lot.id === selectedLot?.id;
            const st = getLotStatusDisplay(lot.status);
            const available = lot.availableSlots ?? Math.max(0, lot.capacity - lot.occupiedCount);
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => onSelectLot(lot.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-surface-inverse bg-surface-subtle shadow-sm'
                    : 'border-border-default bg-surface-card hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-text-primary">{lot.code}</span>
                  <Badge variant={st.variant} className="text-[10px] px-1.5 py-0">
                    {st.label}
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-text-primary line-clamp-1" title={lot.name}>
                  {lot.name}
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {lot.occupiedCount}/{lot.capacity}
                </div>
                <ProgressBar value={lot.occupancyRate} />
                <div className="text-[11px] text-text-secondary">
                  Còn {available} chỗ · {formatAllowedVehicleTypes(lot.allowedVehicleTypes)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2 bảng thực tế dưới: Xe đang gửi + Lượt mới nhất */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
        <Card
          headerTitle={`Xe hiện đang gửi trong bãi (${activeSessions.length})`}
          headerRight={
            <button
              type="button"
              onClick={onGoToHistory}
              className="text-xs font-bold text-info-text hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          }
        >
          {activeSessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary">
              Hiện chưa có xe nào đang đỗ trong bãi.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {activeSessions.slice(0, 5).map((s) => (
                <div key={s.sessionId} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-text-primary flex items-center gap-1.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-warning-default" />
                      {s.licensePlate} · <span className="font-normal text-text-secondary">{s.ownerName}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      {s.parkingLotName} · Vào {formatTimeOnly(s.checkinTime)} ({formatDuration(s.checkinTime)})
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onVerifyAtCheckpoint(s.licensePlate)}
                    className="min-h-8 py-1 px-2.5 text-[11px]"
                  >
                    Cho ra
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          headerTitle="Nhật ký vào/ra gần nhất"
          headerRight={
            <button
              type="button"
              onClick={onGoToHistory}
              className="text-xs font-bold text-info-text hover:underline cursor-pointer"
            >
              Mở nhật ký →
            </button>
          }
        >
          {sessionHistory.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary">
              Chưa có lượt gửi xe nào trong DB.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {sessionHistory.slice(0, 5).map((s) => {
                const isActive = s.status === 'ACTIVE';
                return (
                  <div key={s.sessionId} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-text-primary flex items-center gap-1.5">
                        {isActive ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-warning-default" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                        )}
                        {s.licensePlate} · <span className="font-normal text-text-secondary">{s.parkingLotCode}</span>
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {s.ownerName} · Vào {formatTimeOnly(s.checkinTime)}
                        {s.checkoutTime ? ` → Ra ${formatTimeOnly(s.checkoutTime)}` : ''}
                      </div>
                    </div>
                    <Badge variant={isActive ? 'warning' : 'success'}>
                      {isActive ? 'Đang gửi' : 'Đã ra'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
};
