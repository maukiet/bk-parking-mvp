import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { Camera, CreditCard, Printer, Shield } from 'lucide-react';

export const GateEquipmentStatus: React.FC = () => {
  return (
    <Card headerTitle="Hiện trạng Bãi A – Cổng Lý Thường Kiệt" headerRight="Mã trạm: TK-LTK-02" className="p-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Phân khu xe Bãi A */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-surface-subtle p-2.5 rounded-xl border border-border-default flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-primary">Khu vực xe máy Bãi A</span>
              <span className="font-bold text-danger">Còn 108 chỗ (94%)</span>
            </div>
            <ProgressBar value={94} />
            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-0.5">
              <span>Đang gửi: 1.692 / 1.800 xe</span>
              <span className="font-bold text-danger">● Gần đầy</span>
            </div>
          </div>

          <div className="bg-surface-subtle p-2.5 rounded-xl border border-border-default flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-primary">Khu vực ô tô Bãi A</span>
              <span className="font-bold text-warning-text">Còn 19 chỗ (76%)</span>
            </div>
            <ProgressBar value={76} />
            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-0.5">
              <span>Đang gửi: 61 / 80 xe</span>
              <span className="font-bold text-warning-text">● Sắp đầy</span>
            </div>
          </div>
        </div>

        {/* Trạng thái thiết bị tại cổng Bãi A */}
        <div className="bg-surface-subtle p-2.5 rounded-xl border border-border-default flex flex-col justify-between text-xs">
          <span className="font-bold text-text-primary text-[11px]">Thiết bị trạm kiểm soát Bãi A</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-2 bg-surface-card p-2 rounded-lg border border-border-default">
              <Camera className="w-4 h-4 text-success shrink-0" />
              <div>
                <div className="font-bold text-[11px] text-text-primary">Camera AI biển số</div>
                <div className="text-[10px] text-success-text">98.2% nhận diện</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-card p-2 rounded-lg border border-border-default">
              <CreditCard className="w-4 h-4 text-success shrink-0" />
              <div>
                <div className="font-bold text-[11px] text-text-primary">Đầu đọc thẻ MSSV</div>
                <div className="text-[10px] text-success-text">Hoạt động tốt</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-card p-2 rounded-lg border border-border-default">
              <Printer className="w-4 h-4 text-info shrink-0" />
              <div>
                <div className="font-bold text-[11px] text-text-primary">Khay thẻ cứng</div>
                <div className="text-[10px] text-text-secondary">Còn 155 thẻ tại quầy</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-card p-2 rounded-lg border border-border-default">
              <Shield className="w-4 h-4 text-success shrink-0" />
              <div>
                <div className="font-bold text-[11px] text-text-primary">Barrier tự động</div>
                <div className="text-[10px] text-success-text">Bình thường</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

