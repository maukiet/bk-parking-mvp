import React from 'react';
import { Camera, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface CameraComparisonCardProps {
  registeredPlate: string;
  cameraPlate?: string;
  isMatched: boolean;
  isOffline?: boolean;
}

export const CameraComparisonCard: React.FC<CameraComparisonCardProps> = ({
  registeredPlate,
  cameraPlate,
  isMatched,
  isOffline = false,
}) => {
  return (
    <div className="bg-surface-subtle p-3 rounded-2xl border border-border-default flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-text-primary" /> Camera AI & So khớp tự động
        </span>
        {isOffline ? (
          <span className="flex items-center gap-1 text-info font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> Ngoại tuyến · Bảo vệ tự nhìn so
          </span>
        ) : isMatched ? (
          <span className="flex items-center gap-1 text-success font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100% · Tự động
          </span>
        ) : (
          <span className="flex items-center gap-1 text-danger font-bold">
            <XCircle className="w-3.5 h-3.5" /> Không khớp · Lệch biển số
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 items-center">
        {/* Khung Biển số đăng ký */}
        <div className="bg-surface-card p-2.5 rounded-xl border border-border-default flex flex-col">
          <span className="text-[11px] font-semibold text-text-secondary">Biển số đăng ký:</span>
          <span className="text-xl font-bold text-text-primary tracking-wide">{registeredPlate}</span>
        </div>

        {/* Khung Ảnh camera chụp & Biển số OCR */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col ${
            isOffline
              ? 'bg-info-surface border-info-border'
              : isMatched
              ? 'bg-success-surface border-success-border'
              : 'bg-danger-surface border-danger-border'
          }`}
        >
          <span className="text-[11px] font-semibold text-text-secondary">Camera AI nhận diện:</span>
          <span className="text-xl font-bold tracking-wide text-text-primary">
            {cameraPlate || 'Đang nhận diện...'}
          </span>
        </div>
      </div>
    </div>
  );
};

