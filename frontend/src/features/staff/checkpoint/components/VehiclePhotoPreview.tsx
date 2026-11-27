import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { apiGetBlob } from '../../../../shared/api/apiClient';

interface VehiclePhotoPreviewProps {
  url: string | null | undefined;
  alt: string;
  sizeClassName?: string;
}

interface PhotoLoadState {
  url: string;
  src: string | null;
  failed: boolean;
}

export const VehiclePhotoPreview: React.FC<VehiclePhotoPreviewProps> = ({
  url,
  alt,
  sizeClassName = 'w-16 h-16',
}) => {
  const isProtectedApiDoc = Boolean(url && url.startsWith('/api/'));
  const [photoState, setPhotoState] = useState<PhotoLoadState | null>(null);

  useEffect(() => {
    if (!url || !isProtectedApiDoc) {
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    const controller = new AbortController();

    apiGetBlob(url, controller.signal)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPhotoState({ url, src: objectUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) {
          setPhotoState({ url, src: null, failed: true });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isProtectedApiDoc, url]);

  const currentMatch = photoState && photoState.url === url ? photoState : null;

  if (isProtectedApiDoc && currentMatch?.src && !currentMatch.failed) {
    return (
      <img
        src={currentMatch.src}
        alt={alt}
        className={`${sizeClassName} rounded-2xl object-cover border border-border-default bg-surface-subtle shrink-0`}
      />
    );
  }

  return (
    <div
      title={isProtectedApiDoc ? 'Đang tải hoặc chưa có ảnh xe' : 'Xe chưa đính kèm ảnh thực tế'}
      className={`${sizeClassName} rounded-2xl bg-surface-subtle border border-border-default flex items-center justify-center shrink-0 text-text-secondary`}
    >
      <Car className="w-6 h-6 opacity-70" />
    </div>
  );
};
