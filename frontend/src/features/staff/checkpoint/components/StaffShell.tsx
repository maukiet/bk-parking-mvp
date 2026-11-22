import React, { useState } from 'react';
import { CheckpointSidebar, type StaffTab } from './CheckpointSidebar';
import { CheckpointTopbar } from './CheckpointTopbar';
import { ActionBar } from './ActionBar';
import { ScanArea } from './ScanArea';
import { ScanResultCard } from './ScanResultCard';
import { LotStatusCard } from './LotStatusCard';
import { RecentList } from './RecentList';
import { ShiftSummaryPanel } from './ShiftSummaryPanel';
import { GuestIssueModal } from './GuestIssueModal';
import { GuestExitModal } from './GuestExitModal';
import { IncidentReportModal } from './IncidentReportModal';
import { DashboardView } from '../../dashboard/components/DashboardView';
import { ShiftHistoryView } from '../../shift/components/ShiftHistoryView';
import { ExceptionView } from '../../exception/components/ExceptionView';
import { VehicleSearchView } from '../../search/components/VehicleSearchView';
import { useCheckpoint } from '../hooks/useCheckpoint';

export const StaffShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StaffTab>('checkpoint');
  const [isGuestIssueOpen, setIsGuestIssueOpen] = useState(false);
  const [isGuestExitOpen, setIsGuestExitOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const {
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
    undoEvent,
  } = useCheckpoint();

  const hasResult = currentResult && scanState !== 'idle' && scanState !== 'reading';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface-app text-text-primary relative">
      {toast && (
        <div className="absolute top-3 right-4 bg-success-surface border border-success-border text-success-text px-4 py-2 rounded-xl text-xs font-bold shadow-lg z-50">
          ✓ {toast}
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <CheckpointSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CheckpointTopbar isOffline={isOffline} onToggleOffline={toggleOffline} onEndShiftClick={() => setIsShiftModalOpen(true)} syncQueueCount={syncQueueCount} />

          {activeTab === 'dashboard' && <DashboardView onGoToException={() => setActiveTab('exception')} onGoToCheckpoint={() => setActiveTab('checkpoint')} />}

          {activeTab === 'checkpoint' && (
            <>
              <main className="flex-1 p-3 flex gap-3 overflow-hidden">
                {!hasResult ? (
                  <section className="flex-1 h-full overflow-hidden">
                    <ScanArea onScan={handleScan} isReading={scanState === 'reading'} />
                  </section>
                ) : (
                  <>
                    <section className="w-7/10 h-full overflow-hidden" style={{ flex: '7' }}><ScanResultCard result={currentResult} /></section>
                    <section className="h-full flex flex-col gap-3 overflow-hidden" style={{ flex: '3' }}>
                      <LotStatusCard status={lotStatus} /><RecentList events={recentEvents.slice(0, 3)} onUndo={undoEvent} />
                    </section>
                  </>
                )}
              </main>

              <ActionBar
                scanState={scanState}
                isSubmitting={isSubmitting}
                isOffline={isOffline}
                onReject={handleReject}
                onTransferException={() => { handleTransferException(); setActiveTab('exception'); }}
                onResetIdle={resetToIdle}
                onOpenGuestIssue={() => setIsGuestIssueOpen(true)}
                onOpenGuestExit={() => setIsGuestExitOpen(true)}
                onOpenIncident={() => setIsIncidentOpen(true)}
              />
            </>
          )}

          {activeTab === 'exception' && <ExceptionView />}
          {activeTab === 'search' && <VehicleSearchView onBackToCheckpoint={() => setActiveTab('checkpoint')} onGoToException={() => setActiveTab('exception')} />}
          {activeTab === 'shift' && <ShiftHistoryView />}
        </div>
      </div>

      <ShiftSummaryPanel
        data={shiftSummary}
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onConfirmEndShift={() => { setIsShiftModalOpen(false); setActiveTab('shift'); }}
      />

      <GuestIssueModal
        isOpen={isGuestIssueOpen}
        onClose={() => setIsGuestIssueOpen(false)}
        onConfirm={(code, plate) => { handleIssueGuestCard(code, plate); showToast(`Đã cấp thẻ ${code} cho xe ${plate}`); }}
      />

      <GuestExitModal
        isOpen={isGuestExitOpen}
        onClose={() => setIsGuestExitOpen(false)}
        onConfirm={(code) => { handleCollectGuestCard(code); showToast(`Đã thu hồi thẻ ${code}`); }}
      />

      <IncidentReportModal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
        onSubmit={(type) => showToast(`Đã gửi báo cáo: ${type}`)}
      />
    </div>
  );
};
