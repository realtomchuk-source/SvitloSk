import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { HeroCard } from '@/components/home/HeroCard';
import { DashboardBar } from '@/components/home/DashboardBar';
import { SubqueueSelector } from '@/components/home/SubqueueSelector';
import { InteractiveTimeline } from '@/components/home/InteractiveTimeline';

import '@/styles/legacy/home.css';
import '@/styles/legacy/tech-ui.css';
import '@/styles/legacy/selector.css';
import '@/styles/legacy/sssk-modern.css';

export const Home: React.FC = () => {
  const { selectedGroup, setSelectedGroup, scheduleData } = useStore();
  const fallbackSchedule = "1".repeat(24);
  const currentQueuesStr = scheduleData?.queues[selectedGroup] || fallbackSchedule;
  
  const [realTime, setRealTime] = useState(new Date());
  
  // TIME MACHINE STATE
  const [scrubSlot, setScrubSlot] = useState<number | null>(null);

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
    
    if (scrubSlot !== null) {
      // Set to virtual time (slot 0 = 00:00, slot 1 = 00:30, etc.)
      const vHour = Math.floor(scrubSlot / 2);
      const vMin = (scrubSlot % 2) * 30;
      referenceDate.setHours(vHour, vMin, 0, 0);
    }

    const info = getStatusInfo(currentQueuesStr, referenceDate);
    
    return {
      referenceDate,
      isVirtual: scrubSlot !== null,
      isOn: info.isCurrentlyOn,
      timeH: info.h,
      timeM: info.m,
      nextChangeHour: info.nextChangeHour
    };
  }, [realTime, scrubSlot, currentQueuesStr]);
  
  // VIRTUAL POINTER PERCENT
  // Use SLOTS_COUNT - 1 (47) to perfectly align 100% with the right edge
  const pointerPercent = scrubSlot !== null 
    ? (scrubSlot / 47) * 100 
    : ((realTime.getHours() * 60 + realTime.getMinutes()) / 1440) * 100;

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
        />
        
        <InteractiveTimeline 
          queuesStr={currentQueuesStr} 
          onScrub={setScrubSlot}
        />

        <SubqueueSelector 
          selectedGroup={selectedGroup}
          onSelect={setSelectedGroup}
        />
      </section>
    </div>
  );
};

