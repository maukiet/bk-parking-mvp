import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Chip } from '../../../../components/ui/Chip';
import type { RecentEvent } from '../types';

interface RecentListProps {
  events: RecentEvent[];
  onUndo: (id: string) => void;
}

export const RecentList: React.FC<RecentListProps> = ({ events, onUndo }) => {
  const [filter, setFilter] = useState<'all' | 'abnormal' | 'guest'>('all');

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  return (
    <Card headerTitle="Lượt vào/ra gần nhất">
      <div className="flex items-center gap-2">
        <Chip active={filter === 'all'} label="Tất cả" onClick={() => setFilter('all')} />
        <Chip active={filter === 'abnormal'} label="Bất thường" onClick={() => setFilter('abnormal')} />
        <Chip active={filter === 'guest'} label="Khách" onClick={() => setFilter('guest')} />
      </div>

      <div className="flex flex-col divide-y divide-border-subtle mt-1 overflow-hidden">
        {filtered.map((item) => (
          <div key={item.id} className="py-2 flex items-center justify-between text-xs">
            <span className="text-text-secondary w-14 shrink-0">{item.time}</span>
            <div className="flex flex-col flex-1 px-2">
              <div className="flex items-center gap-1.5 font-bold text-text-primary">
                <span>{item.plate}</span>
                <span className="text-text-secondary font-normal">{item.direction === 'in' ? 'Vào' : 'Ra'}</span>
                {item.status === 'abnormal' ? (
                  <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                )}
              </div>
              {item.person && <span className="text-text-secondary text-[11px] truncate">{item.person}</span>}
            </div>
            {item.canUndo && (
              <button
                type="button"
                onClick={() => onUndo(item.id)}
                className="text-text-primary font-bold hover:underline shrink-0"
              >
                Hoàn tác
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

