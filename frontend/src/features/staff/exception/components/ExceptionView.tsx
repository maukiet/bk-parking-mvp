import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ExceptionCaseList, type ExceptionCase } from './ExceptionCaseList';
import { ExceptionDetail } from './ExceptionDetail';
import { ExceptionReportModal } from './ExceptionReportModal';

const initialCases: ExceptionCase[] = [
  {
    id: 'e1',
    type: 'qr_camera_error',
    title: 'Camera/QR lỗi',
    plate: '59X3-456.78',
    time: '07:44:50',
    lot: 'Bãi A',
    owner: 'Trần Quốc Bảo · MSSV 2011876',
    role: 'Sinh viên (SV)',
    vehicle: 'Xe máy · Honda Vision · Đen',
  },
  {
    id: 'e2',
    type: 'lost_guest_card',
    title: 'Mất thẻ khách',
    plate: '59P1-123.45',
    time: '07:42:18',
    lot: 'Bãi A',
    owner: 'Khách vãng lai',
    role: 'Thẻ cứng #V088',
    vehicle: 'Xe máy · Honda AirBlade · Đỏ',
    feeNote: 'Lập biên bản mất thẻ cứng: Đối chiếu camera biển số để cho xe ra (Thu phí bên ngoài)',
  },
  {
    id: 'e3',
    type: 'no_entry_record',
    title: 'Ra thiếu lượt vào',
    plate: '59T2-864.20',
    time: '07:39:06',
    lot: 'Bãi A',
    owner: 'Lê Hoàng Nam · MSSV 2210984',
    role: 'Sinh viên (SV)',
    vehicle: 'Xe máy · Yamaha Sirius · Đen',
  },
];

export const ExceptionView: React.FC = () => {
  const [cases, setCases] = useState<ExceptionCase[]>(initialCases);
  const [selectedId, setSelectedId] = useState('e1');
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentCase = cases.find((c) => c.id === selectedId) ?? cases[0];

  const handleConfirm = () => {
    if (!currentCase) return;
    setSuccessId(currentCase.id);
    setTimeout(() => {
      setCases((prev) => {
        const next = prev.filter((c) => c.id !== currentCase.id);
        if (next.length > 0) setSelectedId(next[0].id);
        return next;
      });
      setSuccessId(null);
      setVerified(false);
      setNote('');
    }, 1500);
  };

  const handleCreateReport = (data: Record<string, string>) => {
    const newCase: ExceptionCase = {
      id: `e-${Date.now()}`,
      type: data.incidentType.includes('Mất thẻ') ? 'lost_guest_card' : 'no_entry_record',
      title: data.incidentType,
      plate: data.plate,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      lot: 'Bãi A',
      owner: `${data.name} · SĐT ${data.phone}`,
      role: `CCCD: ${data.idCard}`,
      vehicle: 'Xe máy',
      feeNote: data.desc,
    };
    setCases((prev) => [newCase, ...prev]);
    setSelectedId(newCase.id);
  };

  if (cases.length === 0) {
    return (
      <main className="flex-1 p-3 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-12 h-12 text-success" />
          <p className="text-lg font-bold text-text-primary">Không có vụ ngoại lệ nào trong ca này</p>
          <p className="text-sm text-text-secondary">Tất cả trường hợp đã được xử lý.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 flex gap-3 overflow-hidden">
      <ExceptionCaseList
        cases={cases}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateReport={() => setIsCreateOpen(true)}
      />
      {currentCase && (
        <ExceptionDetail
          currentCase={currentCase}
          verified={verified}
          note={note}
          successId={successId}
          onToggleVerified={() => setVerified((v) => !v)}
          onNoteChange={setNote}
          onConfirm={handleConfirm}
        />
      )}
      <ExceptionReportModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateReport}
      />
    </main>
  );
};
