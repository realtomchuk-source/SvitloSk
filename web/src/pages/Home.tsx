import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { HeroCard } from '@/components/home/HeroCard';
import { DashboardBar } from '@/components/home/DashboardBar';
import { SubqueueSelector } from '@/components/home/SubqueueSelector';
import { InteractiveTimeline } from '@/components/home/InteractiveTimeline';
import { MarqueeBanner } from '@/components/home/MarqueeBanner';
import { usePWA } from '@/hooks/usePWA';
import { PWAInstallSheet } from '@/pages/Cabinet/components/PWAInstallSheet';
import { Download, X } from 'lucide-react';

import '@/styles/legacy/home.css';
import '@/styles/legacy/tech-ui.css';
import '@/styles/legacy/selector.css';
import '@/styles/legacy/sssk-modern.css';

export const Home: React.FC = () => {
  const { selectedGroup, scheduleData } = useStore();
  const fallbackSchedule = "1".repeat(24);
  const currentQueuesStr = scheduleData?.queues[selectedGroup] || fallbackSchedule;
  
  const [realTime, setRealTime] = useState(new Date());
  
  // TIME MACHINE STATE (Continuous)
  const [scrubPercent, setScrubPercent] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { canInstall, install, isIOS } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [isInstallSheetOpen, setInstallSheetOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('sssk_pwa_banner_dismissed') === 'true';
    if (canInstall && !dismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [canInstall]);

  const handleDismissBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('sssk_pwa_banner_dismissed', 'true');
    setShowBanner(false);
  };

  const handleBannerClick = () => {
    setInstallSheetOpen(true);
  };

  // CENTRALIZED DISPLAY CONTEXT (The 'Time Machine' Hub)
  const displayContext = React.useMemo(() => {
    // Determine the reference time (Real or Virtual)
    let referenceDate = new Date(realTime);
    
    if (scrubPercent !== null) {
      // High-precision virtual time (0 - 1439 minutes)
      const totalMinutes = Math.floor(scrubPercent * 1439);
      const vHour = Math.floor(totalMinutes / 60);
      const vMin = totalMinutes % 60;
      referenceDate.setHours(vHour, vMin, 0, 0);
    }

    const info = getStatusInfo(currentQueuesStr, referenceDate);
    
    return {
      referenceDate,
      isVirtual: scrubPercent !== null,
      isPast: scrubPercent !== null && referenceDate < realTime,
      isOn: info.isCurrentlyOn,
      timeH: info.h,
      timeM: info.m,
      nextChangeHour: info.nextChangeHour
    };
  }, [realTime, scrubPercent, currentQueuesStr]);
  
  // VIRTUAL POINTER PERCENT
  const pointerPercent = scrubPercent !== null 
    ? scrubPercent * 100 
    : ((realTime.getHours() * 60 + realTime.getMinutes()) / 1440) * 100;

  // Discrete slot for labels (0 - 47)
  const currentRealSlot = Math.floor((realTime.getHours() * 60 + realTime.getMinutes()) / 30);
  const activeSlot = scrubPercent !== null 
    ? Math.max(0, Math.min(47, Math.floor(scrubPercent * 48))) 
    : currentRealSlot;

  return (
    <div className={clsx("page-home", !displayContext.isOn && "status-off")}>
      <section id="home-section" className="animate-in fade-in duration-700">
        {showBanner && (
          <div 
            onClick={handleBannerClick}
            style={{
              position: 'fixed',
              top: '12px',
              left: '20px',
              right: '20px',
              zIndex: 1000,
              background: '#ffffff',
              border: '1.5px solid #e4e4e7',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(238, 114, 33, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EE7221',
                flexShrink: 0
              }}>
                <Download size={16} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                  Додай SvitloSk на робочий стіл
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  background: '#EE7221',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                Встановити
              </span>
              <button 
                onClick={handleDismissBanner}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Закрити"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <HeroCard 
          isOn={displayContext.isOn}
          timeH={displayContext.timeH}
          timeM={displayContext.timeM}
          nextChangeHour={displayContext.nextChangeHour}
          queuesStr={currentQueuesStr}
          currentTimePercent={pointerPercent}
          isVirtual={displayContext.isVirtual}
        />

        <DashboardBar 
          isOn={displayContext.isOn} 
          realTime={displayContext.referenceDate} 
          isVirtual={displayContext.isVirtual}
          isPast={displayContext.isPast}
        />

        <MarqueeBanner isOn={displayContext.isOn} />
        
        <InteractiveTimeline 
          queuesStr={currentQueuesStr} 
          activeSlot={activeSlot}
          currentRealSlot={currentRealSlot}
          onScrub={setScrubPercent}
          pointerPercent={pointerPercent}
        />

        <SubqueueSelector />
      </section>

      <PWAInstallSheet 
        isOpen={isInstallSheetOpen}
        onClose={() => setInstallSheetOpen(false)}
        isIOS={isIOS}
        onInstall={install}
      />
    </div>
  );
};

