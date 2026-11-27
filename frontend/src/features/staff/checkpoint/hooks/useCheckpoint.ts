import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractApiError } from '../../../../api/client';
import { clearSession } from '../../../auth/authApi';
import type {
  ParkingLotDto,
  ParkingSessionDto,
  StaffVehicleSearchResultDto,
} from '../../../../types/api';
import { scanApi } from '../api/scan';
import { searchApi } from '../../search/api/searchApi';
import type { CheckpointPhase, CheckpointReview, StaffNotice } from '../types';
import { formatVehicleType, lotAcceptsVehicleType } from '../../utils/formatters';

const SELECTED_LOT_STORAGE_KEY = 'bkparking.staff.selectedLotId';
const AUTO_SYNC_INTERVAL_MS = 15000;

function normalizePlateKey(raw: string): string {
  return raw.replace(/[-.\s]/g, '').toLowerCase();
}

function readStoredLotId(): number | null {
  const raw = localStorage.getItem(SELECTED_LOT_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const useCheckpoint = () => {
  const [lots, setLots] = useState<ParkingLotDto[]>([]);
  const [selectedLotId, setSelectedLotIdState] = useState<number>(() => readStoredLotId() ?? 1);
  const [activeSessions, setActiveSessions] = useState<ParkingSessionDto[]>([]);
  const [sessionHistory, setSessionHistory] = useState<ParkingSessionDto[]>([]);
  const [vehicles, setVehicles] = useState<StaffVehicleSearchResultDto[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [authExpired, setAuthExpired] = useState(false);

  const [phase, setPhase] = useState<CheckpointPhase>('idle');
  const [scanInput, setScanInput] = useState('');
  const [review, setReview] = useState<CheckpointReview | null>(null);
  const [verifiedLotId, setVerifiedLotId] = useState<number | null>(null);
  const [gateNote, setGateNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<StaffNotice | null>(null);

  const showNotice = useCallback((variant: StaffNotice['variant'], message: string) => {
    setNotice({ variant, message });
    window.setTimeout(() => {
      setNotice((current) => (current?.message === message ? null : current));
    }, 4500);
  }, []);

  const handlePossibleAuthError = useCallback((err: unknown) => {
    const parsed = extractApiError(err);
    if (parsed.status === 401) {
      clearSession();
      setAuthExpired(true);
    }
    return parsed;
  }, []);

  const applyCoreSnapshot = useCallback(
    (
      lotsData: ParkingLotDto[],
      activeData: ParkingSessionDto[],
      historyData: ParkingSessionDto[],
    ) => {
      setLots(lotsData);
      setActiveSessions(activeData);
      setSessionHistory(historyData);
      setLastSyncedAt(
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
      if (lotsData.length > 0) {
        setSelectedLotIdState((current) =>
          lotsData.some((lot) => lot.id === current) ? current : lotsData[0].id,
        );
      }
    },
    [],
  );

  const fetchCoreSnapshot = useCallback(
    () =>
      Promise.all([
        scanApi.getParkingLots(),
        scanApi.getActiveSessions(),
        scanApi.getSessionHistory(undefined, 50),
      ]),
    [],
  );

  const fetchFullSnapshot = useCallback(
    () =>
      Promise.all([
        scanApi.getParkingLots(),
        scanApi.getActiveSessions(),
        scanApi.getSessionHistory(),
        searchApi.searchVehicles(''),
      ]),
    [],
  );

  const refreshCore = useCallback(async () => {
    try {
      const [lotsData, activeData, historyData] = await fetchCoreSnapshot();
      setDataError(null);
      applyCoreSnapshot(lotsData, activeData, historyData);
    } catch (err) {
      const parsed = handlePossibleAuthError(err);
      setDataError(parsed.message);
    }
  }, [applyCoreSnapshot, fetchCoreSnapshot, handlePossibleAuthError]);

  const refreshAll = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const [lotsData, activeData, historyData, vehiclesData] = await fetchFullSnapshot();
      applyCoreSnapshot(lotsData, activeData, historyData);
      setVehicles(vehiclesData);
    } catch (err) {
      const parsed = handlePossibleAuthError(err);
      setDataError(parsed.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [applyCoreSnapshot, fetchFullSnapshot, handlePossibleAuthError]);

  // Initial load on mount
  useEffect(() => {
    let cancelled = false;
    fetchFullSnapshot()
      .then(([lotsData, activeData, historyData, vehiclesData]) => {
        if (cancelled) return;
        setDataError(null);
        applyCoreSnapshot(lotsData, activeData, historyData);
        setVehicles(vehiclesData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const parsed = handlePossibleAuthError(err);
        setDataError(parsed.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyCoreSnapshot, fetchFullSnapshot, handlePossibleAuthError]);

  // Lightweight background polling + tab focus sync
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && phase === 'idle') {
        void refreshCore();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && phase === 'idle') {
        void fetchFullSnapshot()
          .then(([lotsData, activeData, historyData, vehiclesData]) => {
            setDataError(null);
            applyCoreSnapshot(lotsData, activeData, historyData);
            setVehicles(vehiclesData);
          })
          .catch((err: unknown) => {
            const parsed = handlePossibleAuthError(err);
            setDataError(parsed.message);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [applyCoreSnapshot, fetchFullSnapshot, handlePossibleAuthError, phase, refreshCore]);

  const setSelectedLotId = useCallback((lotId: number) => {
    setSelectedLotIdState(lotId);
    localStorage.setItem(SELECTED_LOT_STORAGE_KEY, String(lotId));
    setActionError(null);
  }, []);

  const selectedLot = useMemo(
    () => lots.find((lot) => lot.id === selectedLotId) ?? lots[0],
    [lots, selectedLotId],
  );

  const resetToIdle = useCallback((prefillQuery = '') => {
    setPhase('idle');
    setReview(null);
    setVerifiedLotId(null);
    setGateNote('');
    setActionError(null);
    setScanInput(prefillQuery);
  }, []);

  const handleVerify = useCallback(
    async (rawCode: string) => {
      const clean = rawCode.trim();
      if (!clean || phase === 'verifying' || phase === 'submitting') return;

      setPhase('verifying');
      setReview(null);
      setVerifiedLotId(selectedLotId);
      setGateNote('');
      setActionError(null);

      try {
        const cleanUpper = clean.toUpperCase();
        const normClean = normalizePlateKey(clean);
        const normalizedMatches =
          !cleanUpper.startsWith('BKQR-') && normClean.length >= 4
            ? vehicles.filter((v) => normalizePlateKey(v.licensePlate) === normClean)
            : [];
        const verifyTarget =
          normalizedMatches.length === 1
            ? normalizedMatches[0].qrToken || normalizedMatches[0].licensePlate
            : clean;

        const verified = await scanApi.verifyPass(verifyTarget, selectedLotId);
        setReview({ query: clean, verified, notFound: null });
        setPhase('reviewed');
        setScanInput('');
      } catch (err) {
        const parsed = handlePossibleAuthError(err);
        if (parsed.status === 401) {
          setPhase('idle');
          return;
        }
        if (parsed.status === 400 || parsed.status === 404) {
          let suggestions: StaffVehicleSearchResultDto[] = [];
          try {
            suggestions = await searchApi.searchVehicles(clean);
          } catch {
            suggestions = [];
          }
          if (suggestions.length === 0) {
            const normClean = normalizePlateKey(clean);
            const cleanLower = clean.toLowerCase();
            suggestions = vehicles.filter((v) => {
              const text = `${v.licensePlate} ${v.ownerName} ${v.ownerCode} ${v.qrToken ?? ''}`.toLowerCase();
              return (
                text.includes(cleanLower) ||
                (normClean.length >= 2 && normalizePlateKey(v.licensePlate).includes(normClean))
              );
            });
          }
          setReview({
            query: clean,
            verified: null,
            notFound: {
              query: clean,
              message: parsed.message,
              suggestions,
            },
          });
          setPhase('reviewed');
          return;
        }
        setActionError(parsed.message);
        setPhase('idle');
        showNotice('danger', parsed.message);
      }
    },
    [handlePossibleAuthError, phase, selectedLotId, showNotice, vehicles],
  );

  const entryBlockReason = useMemo(() => {
    const v = review?.verified;
    if (!v || v.recommendedAction !== 'CHECK_IN') return null;
    if (!selectedLot) return 'Chưa chọn bãi đỗ xe làm việc.';
    if (verifiedLotId === selectedLot.id && v.lotEligible === false && v.lotWarningMessage) {
      return v.lotWarningMessage;
    }
    if (selectedLot.status !== 'OPEN') {
      return `Bãi ${selectedLot.name} hiện không mở cửa (trạng thái: ${selectedLot.status}).`;
    }
    const available =
      selectedLot.availableSlots ?? Math.max(0, selectedLot.capacity - selectedLot.occupiedCount);
    if (available <= 0) {
      return `Bãi ${selectedLot.name} đã hết chỗ trống.`;
    }
    if (!lotAcceptsVehicleType(selectedLot, v.vehicleType)) {
      return `Bãi ${selectedLot.name} không nhận loại xe ${formatVehicleType(v.vehicleType)}. Hãy chuyển sang bãi phù hợp.`;
    }
    return null;
  }, [review, selectedLot, verifiedLotId]);

  const handleConfirmEntry = useCallback(async () => {
    const v = review?.verified;
    if (!v || !v.validForEntry || !selectedLot || entryBlockReason || phase === 'submitting') {
      return;
    }
    setPhase('submitting');
    setActionError(null);

    try {
      const saved = await scanApi.checkIn({
        qrOrPlate: v.qrToken || v.licensePlate,
        parkingLotId: selectedLot.id,
        entryGate: `Cổng ${selectedLot.code}`,
        note: gateNote.trim() || undefined,
      });
      resetToIdle('');
      showNotice(
        'success',
        `Đã ghi nhận xe ${saved.licensePlate} VÀO ${saved.parkingLotName}.`,
      );
      await refreshAll();
    } catch (err) {
      const parsed = handlePossibleAuthError(err);
      if (parsed.status === 401) {
        resetToIdle('');
        return;
      }
      setActionError(parsed.message);
      setPhase('reviewed');
    }
  }, [
    entryBlockReason,
    gateNote,
    handlePossibleAuthError,
    phase,
    refreshAll,
    resetToIdle,
    review,
    selectedLot,
    showNotice,
  ]);

  const handleConfirmExit = useCallback(async () => {
    const v = review?.verified;
    if (!v || !v.validForExit || phase === 'submitting') return;

    setPhase('submitting');
    setActionError(null);

    try {
      const exitGate = selectedLot ? `Cổng ra ${selectedLot.code}` : 'Cổng ra chính';
      const saved = await scanApi.checkOut({
        qrOrPlate: v.qrToken || v.licensePlate,
        exitGate,
        note: gateNote.trim() || undefined,
      });
      resetToIdle('');
      showNotice(
        'success',
        `Đã ghi nhận xe ${saved.licensePlate} RA khỏi ${saved.parkingLotName}.`,
      );
      await refreshAll();
    } catch (err) {
      const parsed = handlePossibleAuthError(err);
      if (parsed.status === 401) {
        resetToIdle('');
        return;
      }
      setActionError(parsed.message);
      setPhase('reviewed');
    }
  }, [
    gateNote,
    handlePossibleAuthError,
    phase,
    refreshAll,
    resetToIdle,
    review,
    selectedLot,
    showNotice,
  ]);

  return {
    lots,
    selectedLot,
    selectedLotId,
    setSelectedLotId,
    activeSessions,
    sessionHistory,
    vehicles,
    isLoadingData,
    dataError,
    lastSyncedAt,
    authExpired,
    phase,
    scanInput,
    setScanInput,
    review,
    gateNote,
    setGateNote,
    actionError,
    entryBlockReason,
    notice,
    refreshAll,
    handleVerify,
    handleConfirmEntry,
    handleConfirmExit,
    resetToIdle,
  };
};
