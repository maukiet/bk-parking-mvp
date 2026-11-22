import React, { useState } from 'react';
import { Calendar, CreditCard } from 'lucide-react';
import { ShiftDetailCard, type PastShift } from './ShiftDetailCard';

const mockPastShifts: PastShift[] = [
  {
    id: 's1',
    shiftName: 'Ca sáng (Hôm nay)',
    date: '12/11/2026',
    timeRange: '06:00 – 14:00',
    guardName: 'Nguyễn Văn B',
    totalIn: 428,
    totalOut: 382,
    guestIssued: 45,
    guestCollected: 38,
    rejectedCount: 4,
    exceptionsCount: 3,
  },
  {
    id: 's2',
    shiftName: 'Ca đêm (Hôm qua)',
    date: '11/11/2026',
    timeRange: '22:00 – 06:00',
    guardName: 'Lê Văn T',
    totalIn: 98,
    totalOut: 112,
    guestIssued: 12,
    guestCollected: 14,
    rejectedCount: 1,
    exceptionsCount: 1,
  },
  {
    id: 's3',
    shiftName: 'Ca chiều',
    date: '11/11/2026',
    timeRange: '14:00 – 22:00',
    guardName: 'Trần Đình C',
    totalIn: 512,
    totalOut: 620,
    guestIssued: 60,
    guestCollected: 58,
    rejectedCount: 6,
    exceptionsCount: 4,
  },
  {
    id: 's4',
    shiftName: 'Ca sáng',
    date: '11/11/2026',
    timeRange: '06:00 – 14:00',
    guardName: 'Nguyễn Văn B',
    totalIn: 440,
    totalOut: 395,
    guestIssued: 48,
    guestCollected: 42,
    rejectedCount: 2,
    exceptionsCount: 2,
  },
];

export const ShiftHistoryView: React.FC = () => {
  const [selectedShiftId, setSelectedShiftId] = useState('s1');
  const selectedShift = mockPastShifts.find((s) => s.id === selectedShiftId) ?? mockPastShifts[0];

  return (
    <main className="flex-1 p-3 flex gap-3 overflow-hidden">
      {/* Cột trái: Danh sách các ca đã chốt */}
      <section className="w-84 h-full bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Lịch sử chốt ca trực</h2>
          <span className="text-xs text-text-secondary">{mockPastShifts.length} ca gần nhất</span>
        </div>
        <div className="text-xs text-text-secondary bg-surface-subtle p-2 rounded-xl">
          Số liệu đối soát lượt xe và lưu trữ lượt khách vãng lai theo ca
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {mockPastShifts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedShiftId(s.id)}
              className={`p-3 rounded-xl border text-left transition-all min-h-16 ${
                selectedShiftId === s.id
                  ? 'border-surface-inverse bg-surface-subtle shadow-sm'
                  : 'border-border-default hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">{s.shiftName}</span>
                <span className="text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {s.date}
                </span>
              </div>
              <div className="text-xs text-text-secondary mt-0.5">{s.timeRange} · {s.guardName}</div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <span className="text-text-secondary">{s.totalIn} Vào / {s.totalOut} Ra</span>
                <span className="font-bold text-info-text flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Khách: {s.guestIssued} cấp · {s.guestCollected} thu
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-text-secondary">
          Bấm vào từng ca để xem chi tiết đối soát lượt xe và thẻ khách đã chốt.
        </p>
      </section>

      {/* Cột phải: Chi tiết ca được chọn */}
      <section className="flex-1 h-full overflow-hidden">
        <ShiftDetailCard shift={selectedShift} />
      </section>
    </main>
  );
};
