import React, { useEffect, useState } from 'react';
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

  // REAL TIME STATUS (Always facts for now)
  const currentHour = realTime.getHours();
  const isOn = currentQueuesStr[currentHour] === '1';
  
  let nextChangeHour = 24;
  for (let i = currentHour + 1; i < 24; i++) {
    if (currentQueuesStr[i] !== (isOn ? '1' : '0')) {
      nextChangeHour = i;
      break;
    }
  }

  const { h: timeH, m: timeM } = getStatusInfo(currentQueuesStr);
  
  // VIRTUAL POINTER PERCENT
  // Use SLOTS_COUNT - 1 (47) to perfectly align 100% with the right edge
  const pointerPercent = scrubSlot !== null 
    ? (scrubSlot / 47) * 100 
    : ((realTime.getHours() * 60 + realTime.getMinutes()) / 1440) * 100;

  return (
    <div className="page-home">
      <section id="home-section" className="animate-in fade-in duration-700">
        <div style={{ height: '16px' }} />


        <HeroCard 
          isOn={isOn}
          timeH={timeH}
          timeM={timeM}
          nextChangeHour={nextChangeHour}
          queuesStr={currentQueuesStr}
          currentTimePercent={pointerPercent}
        />

        <DashboardBar isOn={isOn} realTime={realTime} />
        
        <InteractiveTimeline 
          queuesStr={currentQueuesStr} 
          onScrub={setScrubSlot}
        />

        <SubqueueSelector 
          selectedGroup={selectedGroup}
          onSelect={setSelectedGroup}
        />
        
        {/* Spacer for bottom nav */}
        <div style={{ height: '100px' }} />
      </section>
    </div>
  );
};

