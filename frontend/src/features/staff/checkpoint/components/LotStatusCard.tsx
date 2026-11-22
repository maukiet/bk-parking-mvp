import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import type { LotStatus } from '../types';

interface LotStatusCardProps {
  status: LotStatus;
}

export const LotStatusCard: React.FC<LotStatusCardProps> = ({ status }) => {
  const percent = Math.round((status.occupied / status.total) * 100);

  return (
    <Card headerTitle="Tình trạng bãi" headerRight={`${status.occupied} / ${status.total} xe`}>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-text-primary">còn {status.available} chỗ</div>
        <div className="flex items-center gap-1.5 text-danger font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div className="text-right">
            <div>{percent}% lấp đầy</div>
            <div className="text-[11px] font-normal text-text-secondary">Gần đầy · trên 90%</div>
          </div>
        </div>
      </div>
      <ProgressBar value={percent} />
      <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
        <span>Cập nhật lúc {status.updatedAt}</span>
        <button type="button" className="text-text-primary font-bold hover:underline">
          Số đếm sai?
        </button>
      </div>
    </Card>
  );
};

