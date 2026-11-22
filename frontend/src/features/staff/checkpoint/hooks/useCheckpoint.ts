import { useState } from 'react';
import type { ScanState, ScanResult, RecentEvent, LotStatus, ShiftSummaryData } from '../types';
import { mockRecentEvents, mockLotStatus, mockShiftSummary } from '../mock/mockData';
import { scanApi } from '../api/scan';

const getTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const useCheckpoint = () => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>(mockRecentEvents);
  const [lotStatus, setLotStatus] = useState<LotStatus>(mockLotStatus);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummaryData>(mockShiftSummary);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  const resetToIdle = () => {
    setScanState('idle');
    setCurrentResult(null);
  };

  const handleScan = async (rawCode: string) => {
    if (scanState === 'reading' || isSubmitting) return;
    setScanState('reading');
    setCurrentResult(null);

    try {
      const result = await scanApi.verifyPass({ rawCode, isOffline });
      setCurrentResult(result);
      setScanState(result.state);

      if (result.state === 'valid') {
        const isEntry = result.direction === 'in';
        scanApi.confirmAction('allow', result.plateNumber, result.direction);
        setRecentEvents((prev) => [
          { id: Date.now().toString(), time: getTime(), plate: result.plateNumber, direction: result.direction, status: 'normal', person: `${result.ownerName} · ${result.ownerRole}`, canUndo: true },
          ...prev.slice(0, 8),
        ]);
        setShiftSummary((s) => ({ ...s, totalIn: isEntry ? s.totalIn + 1 : s.totalIn, totalOut: !isEntry ? s.totalOut + 1 : s.totalOut }));
        setLotStatus((l) => ({ ...l, occupied: isEntry ? l.occupied + 1 : Math.max(0, l.occupied - 1), available: isEntry ? Math.max(0, l.available - 1) : l.available + 1 }));
      }
    } catch {
      setScanState('invalid');
    }
  };

  const handleReject = async () => {
    if (!currentResult || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await scanApi.confirmAction('reject', currentResult.plateNumber);
      setShiftSummary((prev) => ({ ...prev, rejectedCount: prev.rejectedCount + 1 }));
      resetToIdle();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferException = async () => {
    if (!currentResult || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await scanApi.confirmAction('exception', currentResult.plateNumber);
      setShiftSummary((prev) => ({ ...prev, exceptionCount: prev.exceptionCount + 1 }));
      resetToIdle();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueGuestCard = (cardCode: string, plate: string) => {
    setShiftSummary((p) => ({ ...p, guestCardsIssued: p.guestCardsIssued + 1, totalIn: p.totalIn + 1 }));
    setLotStatus((l) => ({ ...l, occupied: l.occupied + 1, available: Math.max(0, l.available - 1) }));
    setRecentEvents((p) => [{ id: Date.now().toString(), time: getTime(), plate, direction: 'in', status: 'guest', person: `Khách (${cardCode})` }, ...p.slice(0, 8)]);
  };

  const handleCollectGuestCard = (cardCode: string) => {
    setShiftSummary((p) => ({ ...p, guestCardsCollected: p.guestCardsCollected + 1, totalOut: p.totalOut + 1 }));
    setLotStatus((l) => ({ ...l, occupied: Math.max(0, l.occupied - 1), available: l.available + 1 }));
    setRecentEvents((p) => [{ id: Date.now().toString(), time: getTime(), plate: 'Xe khách', direction: 'out', status: 'guest', person: `Thu thẻ ${cardCode}` }, ...p.slice(0, 8)]);
  };

  const toggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    setSyncQueueCount(next ? (c) => c + 1 : 0);
    if (!next) resetToIdle();
  };

  return {
    scanState,
    currentResult,
    isSubmitting,
    isOffline,
    isShiftModalOpen,
    setIsShiftModalOpen,
    syncQueueCount,
    recentEvents,
    lotStatus,
    shiftSummary,
    handleScan,
    handleReject,
    handleTransferException,
    handleIssueGuestCard,
    handleCollectGuestCard,
    toggleOffline,
    resetToIdle,
    undoEvent: (id: string) => setRecentEvents((prev) => prev.filter((e) => e.id !== id)),
  };
};
