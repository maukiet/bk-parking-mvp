import React, { useState } from 'react';
import { Card } from '../../../../components/ui/Card';

export const ShiftOccupancyChart: React.FC = () => {
  const [hoverIdx, setHoverIdx] = useState(2); // 08:00
  const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
  const todayData = [25, 78, 94, 88, 80, 85, 76, 68, 62];
  const yesterdayData = [20, 70, 89, 82, 75, 78, 70, 62, 58];

  const getCoordinates = (val: number, idx: number) => {
    const x = 50 + idx * 65;
    const y = 170 - (val / 100) * 145;
    return { x, y };
  };

  const todayPoints = todayData.map((v, i) => getCoordinates(v, i));
  const yesterdayPoints = yesterdayData.map((v, i) => getCoordinates(v, i));

  const pathToday = todayPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaToday = `${pathToday} L ${todayPoints[todayPoints.length - 1].x} 170 L 50 170 Z`;
  const pathYesterday = yesterdayPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <Card headerTitle="Tỷ lệ lấp đầy Bãi A theo khung giờ ca trực" headerRight="Ca sáng: 06:00 – 14:00" className="p-3">
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
        <span className="font-semibold text-text-primary">Diễn biến lưu lượng Bãi A trong ca</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-text-primary inline-block" /> Ca sáng hôm nay</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-text-secondary inline-block" /> Ca sáng hôm qua</span>
        </div>
      </div>

      <div className="relative w-full h-44 select-none">
        <svg viewBox="0 0 600 190" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="shiftTodayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Đường ngưỡng 90% & 70% */}
          <line x1="50" y1="39.5" x2="570" y2="39.5" stroke="#DC2626" strokeDasharray="4 4" strokeWidth="1" />
          <text x="575" y="42" fill="#DC2626" fontSize="9" fontWeight="bold">90% Gần đầy</text>

          <line x1="50" y1="68.5" x2="570" y2="68.5" stroke="#D97706" strokeDasharray="4 4" strokeWidth="1" />
          <text x="575" y="71" fill="#D97706" fontSize="9" fontWeight="bold">70% Sắp đầy</text>

          {/* Trục hoành */}
          {[100, 80, 60, 40, 20, 0].map((val) => {
            const y = 170 - (val / 100) * 145;
            return (
              <g key={val}>
                <line x1="50" y1={y} x2="570" y2={y} stroke="#E4E6EA" strokeWidth="0.5" />
                <text x="18" y={y + 3} fill="#6B7280" fontSize="9">{val}%</text>
              </g>
            );
          })}

          <path d={areaToday} fill="url(#shiftTodayGrad)" />
          <path d={pathYesterday} fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d={pathToday} fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />

          {todayPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 4.5 : 2.5}
              fill={hoverIdx === i ? '#2563EB' : '#111827'}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}

          {timeSlots.map((t, i) => (
            <text key={t} x={50 + i * 65} y="185" fill="#6B7280" fontSize="9" textAnchor="middle">
              {t}
            </text>
          ))}
        </svg>

        <div
          className="absolute bg-surface-inverse text-text-inverse p-2 rounded-xl text-[10px] pointer-events-none shadow-lg z-10"
          style={{ left: `${15 + hoverIdx * 9}%`, top: '15%' }}
        >
          <div className="font-bold border-b border-border-strong pb-0.5">{timeSlots[hoverIdx]} tại Bãi A</div>
          <div className="text-danger font-bold mt-0.5">● Hôm nay: {todayData[hoverIdx]}%</div>
          <div className="text-text-muted">○ Hôm qua: {yesterdayData[hoverIdx]}%</div>
        </div>
      </div>
    </Card>
  );
};

