import React from 'react';
import { CreditCard, User, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';

export interface PastShift {
  id: string;
  shiftName: string;
  date: string;
  timeRange: string;
  guardName: string;
  totalIn: number;
  totalOut: number;
  guestIssued: number;
  guestCollected: number;
  rejectedCount: number;
  exceptionsCount: number;
}

interface ShiftDetailCardProps {
  shift: PastShift;
}

export const ShiftDetailCard: React.FC<ShiftDetailCardProps> = ({ shift }) => {
  return (
    <Card headerTitle={`Chi tiết: ${shift.shiftName}`} className="h-full justify-between">
      <div className="flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div>
            <div className="text-base font-bold text-text-primary">{shift.date} · {shift.timeRange}</div>
            <div className="text-text-secondary flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5" /> Nhân viên chốt ca: <span className="font-bold text-text-primary">{shift.guardName}</span>
            </div>
          </div>
          <Badge variant="success">Đã hoàn tất chốt ca</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-subtle p-2.5 rounded-xl">
            <span className="text-text-secondary">Lượt xe trong ca:</span>
            <div className="text-base font-bold text-text-primary mt-0.5">{shift.totalIn} Vào · {shift.totalOut} Ra</div>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded-xl">
            <span className="text-text-secondary">Xe khách đang gửi:</span>
            <div className="text-base font-bold text-text-primary mt-0.5">
              {Math.max(0, shift.guestIssued - shift.guestCollected)} xe
            </div>
          </div>
        </div>

        {/* Khối thống kê khách vãng lai */}
        <div className="bg-info-surface border border-info-border p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-info-text font-semibold">Khách vãng lai (Lưu lượt theo thẻ cứng):</span>
            <div className="text-2xl font-bold text-info-text">
              {shift.guestIssued} thẻ cấp · {shift.guestCollected} thẻ thu
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Phí khách vãng lai thu bên ngoài · Trạm kiểm soát chỉ đối soát số lượt thẻ
            </div>
          </div>
          <CreditCard className="w-8 h-8 text-info shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-subtle p-2 rounded-xl">
            <span className="text-text-secondary">Lượt từ chối:</span>
            <div className="text-sm font-bold text-danger">{shift.rejectedCount} lượt</div>
          </div>
          <div className="bg-surface-subtle p-2 rounded-xl">
            <span className="text-text-secondary">Ngoại lệ đã giải quyết:</span>
            <div className="text-sm font-bold text-warning-text">{shift.exceptionsCount} vụ</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-text-secondary pt-2 border-t border-border-subtle flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Số liệu đã được đồng bộ lên máy chủ trung tâm.
      </div>
    </Card>
  );
};
