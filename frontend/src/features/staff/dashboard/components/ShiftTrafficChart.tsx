import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface TrafficPoint {
  hour: string;
  inVal: number;
  outVal: number;
}

const shiftTraffic: TrafficPoint[] = [
  { hour: '06h', inVal: 65, outVal: 8 },
  { hour: '07h', inVal: 168, outVal: 22 },
  { hour: '08h', inVal: 95, outVal: 38 },
  { hour: '09h', inVal: 32, outVal: 45 },
  { hour: '10h', inVal: 24, outVal: 58 },
  { hour: '11h', inVal: 18, outVal: 112 },
  { hour: '12h', inVal: 12, outVal: 64 },
  { hour: '13h', inVal: 10, outVal: 25 },
  { hour: '14h', inVal: 4, outVal: 10 },
];

export const ShiftTrafficChart: React.FC = () => {
  const maxVal = 180;
  const chartHeight = 100;

  return (
    <Card headerTitle="Lưu lượng Vào / Ra Bãi A trong ca" headerRight="Tổng: 428 Vào · 382 Ra" className="p-3">
      <div className="flex items-center gap-4 text-xs text-text-secondary mb-1">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-surface-inverse inline-block rounded-xs" /> Vào Bãi A</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-success inline-block rounded-xs" /> Ra Bãi A</span>
      </div>

      <div className="relative h-28 flex items-end justify-between pt-2 px-2 border-b border-border-default select-none">
        {shiftTraffic.map((d) => {
          const inH = Math.round((d.inVal / maxVal) * chartHeight);
          const outH = Math.round((d.outVal / maxVal) * chartHeight);
          return (
            <div key={d.hour} className="flex flex-col items-center gap-1 h-full justify-end flex-1">
              <div className="flex items-end gap-1 h-full">
                <div className="w-3 bg-surface-inverse rounded-t transition-all" style={{ height: `${inH}px` }} title={`${d.hour}: ${d.inVal} Vào`} />
                <div className="w-3 bg-success rounded-t transition-all" style={{ height: `${outH}px` }} title={`${d.hour}: ${d.outVal} Ra`} />
              </div>
              <span className="text-[10px] text-text-secondary mt-1">{d.hour}</span>
            </div>
          );
        })}
      </div>

      {/* Phân loại phương tiện trong ca tại Bãi A */}
      <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] text-text-secondary">
        <div><span className="font-bold text-text-primary">68%</span> Xe máy SV (291)</div>
        <div><span className="font-bold text-text-primary">18%</span> Xe máy GV/NV (77)</div>
        <div><span className="font-bold text-text-primary">9%</span> Ô tô cán bộ (38)</div>
        <div><span className="font-bold text-text-primary">5%</span> Khách vãng lai (22)</div>
      </div>
    </Card>
  );
};

