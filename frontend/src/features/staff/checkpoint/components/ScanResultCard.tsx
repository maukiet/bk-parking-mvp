import React from 'react';
import { User, CheckCircle2, AlertOctagon, Info, Clock } from 'lucide-react';
import { Banner } from '../../../../components/ui/Banner';
import { CameraComparisonCard } from './CameraComparisonCard';
import type { ScanResult } from '../types';

interface ScanResultCardProps {
  result: ScanResult;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ result }) => {
  const isEntry = result.direction === 'in';

  const bannerConfig = {
    valid: {
      variant: 'success' as const,
      title: isEntry ? 'HỢP LỆ – CHO VÀO' : 'HỢP LỆ – CHO RA',
    },
    warning: {
      variant: 'warning' as const,
      title: 'HỢP LỆ NHƯNG CẦN LƯU Ý',
    },
    invalid: {
      variant: 'danger' as const,
      title: 'KHÔNG HỢP LỆ – TỪ CHỐI',
    },
    manual: {
      variant: 'info' as const,
      title: 'CẦN XÁC NHẬN THỦ CÔNG (NGOẠI TUYẾN)',
    },
    idle: { variant: 'info' as const, title: '' },
    reading: { variant: 'info' as const, title: 'ĐANG ĐỌC DỮ LIỆU...' },
  }[result.state];

  return (
    <div className="h-full bg-surface-card border border-border-muted rounded-2xl p-4 flex flex-col gap-3 shadow-sm overflow-y-auto">
      {/* 1) Banner kết quả */}
      <Banner variant={bannerConfig.variant} title={bannerConfig.title} />

      {/* 2) Hướng VÀO/RA – ngay dưới banner, trên một dòng riêng */}
      <div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-inverse text-text-inverse">
          Hướng tự động: {isEntry ? 'VÀO' : 'RA'}
        </span>
      </div>

      {/* 3) Biển số to – chiếm toàn hàng */}
      <div className="text-display font-bold text-text-primary tracking-tight leading-none">
        {result.plateNumber}
      </div>

      {/* 4) Thông tin xe & chủ */}
      <div className="flex flex-col gap-1">
        <div className="text-sm text-text-secondary">{result.vehicleInfo}</div>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-text-secondary shrink-0" />
          <div>
            <span className="text-base font-bold text-text-primary">{result.ownerName}</span>
            <span className="text-xs text-text-secondary ml-2">
              {result.ownerId} · {result.ownerRole}
            </span>
          </div>
        </div>

        {/* Thời gian gửi xe (lượt ra) hoặc thời gian vào (lượt vào) */}
        {result.state === 'valid' && result.parkingDuration && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Thời gian gửi: <strong className="text-text-primary">{result.parkingDuration}</strong></span>
          </div>
        )}
        {result.state === 'valid' && !result.parkingDuration && result.checkInTime && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Vào lúc: <strong className="text-text-primary">{result.checkInTime}</strong></span>
          </div>
        )}
      </div>

      {/* 4b) Thông báo nghiệp vụ */}
      {result.state === 'valid' && (
        <div className="bg-success-surface border border-success-border text-success-text p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
          <span>Hệ thống đã tự động ghi nhận lượt. Bảo vệ không cần thao tác, chỉ nhìn và cho xe đi.</span>
        </div>
      )}

      {result.state === 'invalid' && (
        <div className="bg-danger-surface border border-danger-border text-danger-text p-2.5 rounded-xl flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-danger mt-0.5" />
          <span className="text-sm font-bold">
            {result.invalidReason || 'Xe không được phép vào. Bấm TỪ CHỐI để kết thúc.'}
          </span>
        </div>
      )}

      {result.state === 'manual' && (
        <div className="bg-info-surface border border-info-border text-info-text p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-info" />
          <span>Chế độ ngoại tuyến: So sánh trực tiếp ảnh camera và biển số trước khi quyết định.</span>
        </div>
      )}

      {/* 5) So khớp camera */}
      <CameraComparisonCard
        registeredPlate={result.plateNumber}
        cameraPlate={result.cameraPlate}
        isMatched={result.isPlateMatched}
        isOffline={result.isOffline}
      />
    </div>
  );
};
