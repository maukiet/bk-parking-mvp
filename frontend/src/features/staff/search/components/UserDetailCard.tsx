import React from 'react';
import { Clock, User, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { UserHistorySection, type HistoryItem } from './UserHistorySection';

export interface UserRecord {
  id: string;
  name: string;
  code: string;
  group: 'SV' | 'GV' | 'NV' | 'Khách';
  plate: string;
  vehicle: string;
  isInLot: boolean;
  checkInTime?: string;
  lotName?: string;
  history: HistoryItem[];
}

interface UserDetailCardProps {
  user: UserRecord;
}

export const UserDetailCard: React.FC<UserDetailCardProps> = ({ user }) => {
  return (
    <section className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* KHỐI TRÊN: Thông tin hồ sơ & Xe đăng ký & Trạng thái trong bãi */}
      <div className="bg-surface-card border border-border-muted rounded-2xl p-4 shrink-0 shadow-sm">
        <div className="flex items-start justify-between">
          {/* Thông tin xe & Biển số */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
              <Car className="w-7 h-7 text-text-primary" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                  {user.plate}
                </span>
                <Badge variant="success">Xe đã đăng ký</Badge>
              </div>
              <span className="text-sm text-text-secondary mt-0.5">{user.vehicle}</span>

              {/* Thông tin chủ xe */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                <User className="w-4 h-4 text-text-secondary shrink-0" />
                <span className="font-bold text-text-primary">{user.name}</span>
                <span className="text-text-secondary">· {user.code}</span>
                <Badge variant={user.group === 'GV' ? 'info' : user.group === 'NV' ? 'warning' : 'neutral'}>
                  Nhóm {user.group}
                </Badge>
              </div>
            </div>
          </div>

          {/* Trạng thái hiện tại trong bãi */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {user.isInLot ? (
              <div className="bg-warning-surface border border-warning-border text-warning-text px-3.5 py-2 rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-bold">Đang trong bãi</div>
                  <div className="text-[11px] text-text-secondary">
                    Vào: {user.checkInTime} ({user.lotName})
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-subtle border border-border-default px-3.5 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="text-right">
                  <div className="text-xs font-bold text-text-primary">Không có trong bãi</div>
                  <div className="text-[11px] text-text-secondary">Phương tiện đang ở ngoài</div>
                </div>
              </div>
            )}
            <span className="text-[11px] text-text-secondary flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-text-secondary" />
              Không hiển thị thông tin gói phí theo bản chốt 12/11
            </span>
          </div>
        </div>
      </div>

      {/* KHỐI DƯỚI: Lịch sử vào / ra kèm bộ lọc */}
      <UserHistorySection history={user.history} />
    </section>
  );
};
