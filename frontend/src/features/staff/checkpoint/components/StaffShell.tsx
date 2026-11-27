import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../../../shared/auth/AuthContext';
import { CheckpointSidebar } from './CheckpointSidebar';
import { CheckpointTopbar } from './CheckpointTopbar';
import { ActionBar } from './ActionBar';
import { ScanArea } from './ScanArea';
import { ScanResultCard } from './ScanResultCard';
import { LotStatusCard } from './LotStatusCard';
import { RecentList } from './RecentList';
import { DashboardView } from '../../dashboard/components/DashboardView';
import { ShiftHistoryView } from '../../shift/components/ShiftHistoryView';
import { VehicleSearchView } from '../../search/components/VehicleSearchView';
import { useCheckpoint } from '../hooks/useCheckpoint';
import type { StaffTab } from '../types';

export const StaffShell: React.FC = () => {
  const navigate = useNavigate();
  const { user: staffUser } = useAuth();
  const [activeTab, setActiveTab] = useState<StaffTab>('checkpoint');

  const {
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
  } = useCheckpoint();

  useEffect(() => {
    if (authExpired) {
      navigate('/login?expired=1', { replace: true });
    }
  }, [authExpired, navigate]);

  const handleTabChange = (nextTab: StaffTab) => {
    setActiveTab(nextTab);
    void refreshAll();
  };

  const handleVerifyFromOtherTab = (code: string) => {
    setActiveTab('checkpoint');
    void handleVerify(code);
  };

  const showResultCard = (phase === 'reviewed' || phase === 'submitting') && review !== null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface-app text-text-primary relative">
      {notice && (
        <div
          role="status"
          className={`absolute top-4 right-5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg z-50 border flex items-center gap-2 ${
            notice.variant === 'success'
              ? 'bg-success-surface border-success-border text-success-text'
              : notice.variant === 'danger'
                ? 'bg-danger-surface border-danger-border text-danger-text'
                : 'bg-info-surface border-info-border text-info-text'
          }`}
        >
          {notice.variant === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : notice.variant === 'danger' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <Info className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <CheckpointSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeCount={activeSessions.length}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CheckpointTopbar
            lots={lots}
            selectedLot={selectedLot}
            onSelectLot={setSelectedLotId}
            staffUser={staffUser}
            isLoadingData={isLoadingData}
            dataError={dataError}
            lastSyncedAt={lastSyncedAt}
            onRefresh={() => void refreshAll()}
          />

          {activeTab === 'checkpoint' && (
            <>
              <main className="flex-1 p-3 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden">
                <section className="lg:flex-[7] min-h-[380px] lg:h-full lg:overflow-hidden">
                  {showResultCard && review ? (
                    <ScanResultCard
                      review={review}
                      selectedLot={selectedLot}
                      entryBlockReason={entryBlockReason}
                      gateNote={gateNote}
                      onGateNoteChange={setGateNote}
                      actionError={actionError}
                      isSubmitting={phase === 'submitting'}
                      onVerifySuggestion={(code) => void handleVerify(code)}
                      onEditQuery={(q) => resetToIdle(q)}
                      onResetIdle={() => resetToIdle('')}
                    />
                  ) : (
                    <ScanArea
                      selectedLot={selectedLot}
                      vehicles={vehicles}
                      scanInput={scanInput}
                      onScanInputChange={setScanInput}
                      isLoadingData={isLoadingData}
                      isVerifying={phase === 'verifying'}
                      onVerify={(code) => void handleVerify(code)}
                      onGoToSearch={() => handleTabChange('search')}
                    />
                  )}
                </section>

                <section className="lg:flex-[3] lg:h-full flex flex-col gap-3 lg:overflow-hidden">
                  <LotStatusCard lot={selectedLot} isLoading={isLoadingData} />
                  <RecentList
                    activeSessions={activeSessions}
                    sessionHistory={sessionHistory}
                    selectedLot={selectedLot}
                    onSelectForVerify={(code) => void handleVerify(code)}
                  />
                </section>
              </main>

              <ActionBar
                phase={phase}
                review={review}
                selectedLot={selectedLot}
                entryBlockReason={entryBlockReason}
                onConfirmEntry={() => void handleConfirmEntry()}
                onConfirmExit={() => void handleConfirmExit()}
                onResetIdle={() => resetToIdle('')}
              />
            </>
          )}

          {activeTab === 'search' && (
            <VehicleSearchView
              vehicles={vehicles}
              sessionHistory={sessionHistory}
              isLoading={isLoadingData}
              dataError={dataError}
              onRefresh={() => void refreshAll()}
              onVerifyAtCheckpoint={handleVerifyFromOtherTab}
              onBackToCheckpoint={() => setActiveTab('checkpoint')}
            />
          )}

          {activeTab === 'shift' && (
            <ShiftHistoryView
              lots={lots}
              selectedLotId={selectedLotId}
              activeSessions={activeSessions}
              sessionHistory={sessionHistory}
              isLoading={isLoadingData}
              onRefresh={() => void refreshAll()}
              onVerifyAtCheckpoint={handleVerifyFromOtherTab}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              lots={lots}
              selectedLot={selectedLot}
              activeSessions={activeSessions}
              sessionHistory={sessionHistory}
              vehicles={vehicles}
              staffUser={staffUser}
              isLoading={isLoadingData}
              onRefresh={() => void refreshAll()}
              onSelectLot={setSelectedLotId}
              onGoToCheckpoint={() => setActiveTab('checkpoint')}
              onGoToSearch={() => handleTabChange('search')}
              onGoToHistory={() => handleTabChange('shift')}
              onVerifyAtCheckpoint={handleVerifyFromOtherTab}
            />
          )}
        </div>
      </div>
    </div>
  );
};
