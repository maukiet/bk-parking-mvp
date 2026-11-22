import React from 'react';
import { ArrowDownRight, Car, CreditCard, Bell } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { ProgressBar } from '../../../../components/ui/ProgressBar';

export const ShiftKpiCards: React.FC = () => {
  return (
    <section className="grid grid-cols-4 gap-3 shrink-0">
      {/* Thẻ 1: Lượt xe trong ca sáng tại Bãi A */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Lượt xe ca này (Bãi A)</span>
          <ArrowDownRight className="w-4 h-4 text-text-primary" />
        </div>
        <div className="text-2xl font-bold text-text-primary mt-1">
          428 <span className="text-xs font-normal text-text-secondary">vào</span> · 382 <span className="text-xs font-normal text-text-secondary">ra</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
          <span className="text-success-text font-bold">+6% so với cùng giờ hôm qua</span>
          <span>· ~7.7 xe/phút</span>
        </div>
      </Card>

      {/* Thẻ 2: Sức chứa hiện tại Bãi A */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Sức chứa Bãi A</span>
          <Car className="w-4 h-4 text-text-primary" />
        </div>
        <div className="text-2xl font-bold text-text-primary mt-1">
          còn 108 <span className="text-xs font-normal text-text-secondary">chỗ trống</span>
        </div>
        <div className="flex items-center justify-between text-xs text-danger font-bold mt-1">
          <span>94% lấp đầy · Gần đầy</span>
          <span className="text-text-secondary font-normal">1.692 / 1.800 xe máy</span>
        </div>
        <ProgressBar value={94} className="mt-1.5" />
      </Card>

      {/* Thẻ 3: Lượt khách vãng lai trong ca */}
      <Card className="p-3 bg-info-surface border-info-border">
        <div className="flex items-center justify-between text-xs text-info-text font-bold">
          <span>Khách vãng lai (Ca này)</span>
          <CreditCard className="w-4 h-4 text-info" />
        </div>
        <div className="text-2xl font-bold text-info-text mt-1">
          45 <span className="text-xs font-normal text-text-secondary">cấp</span> · 38 <span className="text-xs font-normal text-text-secondary">thu</span>
        </div>
        <div className="text-xs text-text-secondary mt-1">
          7 xe khách đang gửi trong bãi
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5">
          Thu phí bên ngoài · Lưu lượt theo thẻ cứng
        </div>
      </Card>

      {/* Thẻ 4: Cảnh báo & Ngoại lệ ca này */}
      <Card className="p-3 bg-danger-surface border-danger-border">
        <div className="flex items-center justify-between text-xs text-danger-text font-bold">
          <span>Cảnh báo &amp; Ngoại lệ (Ca này)</span>
          <Bell className="w-4 h-4 text-danger" />
        </div>
        <div className="text-2xl font-bold text-danger mt-1">
          10 <span className="text-xs font-normal text-danger-text">vụ</span>
        </div>
        <div className="text-xs text-danger-text font-semibold mt-1">
          7 cảnh báo an ninh · 3 vụ ngoại lệ
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5">
          2 chờ xác minh tại trạm Bãi A
        </div>
      </Card>
    </section>
  );
};
