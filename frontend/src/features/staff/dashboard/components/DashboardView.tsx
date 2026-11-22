import React from 'react';
import { ShiftKpiCards } from './ShiftKpiCards';
import { GateEquipmentStatus } from './GateEquipmentStatus';
import { ShiftOccupancyChart } from './ShiftOccupancyChart';
import { ShiftTrafficChart } from './ShiftTrafficChart';
import { ShiftTasksAndAlerts } from './ShiftTasksAndAlerts';

interface DashboardViewProps {
  onGoToException: () => void;
  onGoToCheckpoint: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onGoToException,
  onGoToCheckpoint,
}) => {
  return (
    <main className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto bg-surface-app select-none">
      {/* Tiêu đề ca trực Bãi A */}
      <section className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Bảng điều khiển ca trực – Bãi A (Cổng Lý Thường Kiệt)
          </h1>
          <p className="text-xs text-text-secondary">
            <span className="text-success-text font-bold">● Đang trực ca sáng (06:00 – 14:00)</span> · Nhân viên: Nguyễn Văn B · Trạm TK-LTK-02
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-surface-card border border-border-default text-text-primary">
            Chỉ theo dõi: Bãi A
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-inverse text-text-inverse">
            Ca sáng hôm nay
          </span>
        </div>
      </section>

      {/* 4 Thẻ KPI trọng tâm của ca tại Bãi A */}
      <ShiftKpiCards />

      {/* Hiện trạng Bãi A & Thiết bị trạm */}
      <GateEquipmentStatus />

      {/* 2 Biểu đồ ca trực Bãi A: Tỷ lệ lấp đầy & Lưu lượng Vào/Ra */}
      <section className="grid grid-cols-2 gap-3">
        <ShiftOccupancyChart />
        <ShiftTrafficChart />
      </section>

      {/* Tác vụ cần giải quyết & Cảnh báo an ninh Bãi A */}
      <ShiftTasksAndAlerts
        onGoToException={onGoToException}
        onGoToCheckpoint={onGoToCheckpoint}
      />
    </main>
  );
};
