import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { HeroCard } from '@/components/home/HeroCard';
import { DashboardBar } from '@/components/home/DashboardBar';
import { SubqueueSelector } from '@/components/home/SubqueueSelector';
import { InteractiveTimeline } from '@/components/home/InteractiveTimeline';
import { MarqueeBanner } from '@/components/home/MarqueeBanner';

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
    ? Math.max(0, Math.min(47, Math.round(scrubPercent * 47))) 
    : currentRealSlot;

  return (
    <div className={clsx("page-home", !displayContext.isOn && "status-off")}>
      <section id="home-section" className="animate-in fade-in duration-700">
        <HeroCard 
          isOn={displayContext.isOn}
          timeH={displayContext.timeH}
          timeM={displayContext.timeM}
          nextChangeHour={displayContext.nextChangeHour}
          queuesStr={currentQueuesStr}
          currentTimePercent={pointerPercent}
        />

        <DashboardBar 
          isOn={displayContext.isOn} 
          realTime={displayContext.referenceDate} 
          isVirtual={displayContext.isVirtual}
          isPast={displayContext.isPast}
        />

        <MarqueeBanner />
        
        <InteractiveTimeline 
          queuesStr={currentQueuesStr} 
          activeSlot={activeSlot}
          currentRealSlot={currentRealSlot}
          onScrub={setScrubPercent}
        />

        <SubqueueSelector />
      </section>
    </div>
  );
};

