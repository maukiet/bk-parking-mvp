import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, Loader2, Search, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface ScanAreaProps {
  onScan: (code: string) => void;
  isReading?: boolean;
}

export const ScanArea: React.FC<ScanAreaProps> = ({ onScan, isReading = false }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe phím Enter từ đầu đọc barcode/RFID
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputValue.trim();
    if (!clean) return;
    onScan(clean);
    setInputValue('');
  };

  // Tự động focus vào ô nhập để sẵn sàng nhận tín hiệu đầu đọc mã
  useEffect(() => {
    if (!isReading) {
      inputRef.current?.focus();
    }
  }, [isReading]);

  return (
    <div className="h-full bg-surface-card border border-border-muted rounded-2xl p-6 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary">Trạm kiểm soát Bãi A</h2>
        {isReading ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-info-text">
            <Loader2 className="w-4 h-4 text-info animate-spin" /> Đang kiểm tra dữ liệu...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-text">
            <CheckCircle2 className="w-4 h-4 text-success" /> Đầu đọc &amp; Camera sẵn sàng
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-4 my-auto w-full max-w-lg mx-auto">
        {isReading ? (
          <>
            <div className="w-28 h-28 rounded-2xl border-2 border-info-border bg-info-surface flex items-center justify-center">
              <Loader2 className="w-14 h-14 text-info animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-info-text text-center">Đang xác thực lượt xe...</h3>
            <p className="text-sm text-text-secondary text-center">
              Camera đang đối chiếu biển số và kiểm tra quyền ra/vào bãi.
            </p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border-default bg-surface-subtle flex items-center justify-center">
              <QrCode className="w-12 h-12 text-text-secondary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-text-primary">Quét mã QR / Thẻ sinh viên</h3>
              <p className="text-xs text-text-secondary mt-1">
                Đưa thẻ hoặc QR trước đầu đọc, hoặc nhập thủ công biển số / MSSV bên dưới.
              </p>
            </div>

            {/* Ô quét mã / nhập biển số thực tế */}
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 mt-2">
              <div className="flex-1 flex items-center gap-2 bg-surface-subtle border border-border-default rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-text-secondary shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập MSSV (2011876) hoặc biển số (59X3-456.78)..."
                  className="bg-transparent text-sm font-bold text-text-primary w-full focus:outline-none"
                />
              </div>
              <Button variant="inverse" icon={<ArrowRight className="w-4 h-4" />}>
                Kiểm tra
              </Button>
            </form>

            {/* Gợi ý quét nhanh cho trạm */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs text-text-secondary">
              <span>Thử nhanh:</span>
              <button
                type="button"
                onClick={() => onScan('2011876')}
                className="px-2 py-0.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default font-medium"
              >
                2011876 (Hợp lệ)
              </button>
              <button
                type="button"
                onClick={() => onScan('59P1-123.45')}
                className="px-2 py-0.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default font-medium"
              >
                59P1-123.45
              </button>
              <button
                type="button"
                onClick={() => onScan('59C1-246.80')}
                className="px-2 py-0.5 rounded-full bg-danger-surface text-danger-text border border-danger-border font-medium"
              >
                Khóa / Hết hạn
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-surface-subtle py-2.5 px-4 rounded-xl text-center text-xs text-text-secondary">
        Hệ thống tự động ghi nhận lượt xe hợp lệ khi camera đọc khớp biển số đăng ký.
      </div>
    </div>
  );
};
