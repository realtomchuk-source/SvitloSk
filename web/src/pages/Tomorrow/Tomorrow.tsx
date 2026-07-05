import React, { useEffect, useState, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { HeroCard } from '@/components/home/HeroCard';
import { DashboardBar } from '@/components/home/DashboardBar';
import { SubqueueSelector } from '@/components/home/SubqueueSelector';
import { AlternativeTimeline } from '@/components/home/AlternativeTimeline';
import { MarqueeBanner } from '@/components/home/MarqueeBanner';

import '@/styles/legacy/home.css';
import '@/styles/legacy/tech-ui.css';
import '@/styles/legacy/selector.css';
import '@/styles/legacy/sssk-modern.css';
import './Tomorrow.css'; // Custom theme styling for Tomorrow page

export const Tomorrow: React.FC = () => {
  const { selectedGroup, tomorrowScheduleData } = useStore();
  const fallbackSchedule = "1".repeat(24);
  const tomorrowQueueStr = tomorrowScheduleData?.queues[selectedGroup] || fallbackSchedule;

  // Real clock ticking for dashboard time parsing, but offset by +1 day for tomorrow
  const [realTime, setRealTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle timeout to return pointer to 00:00 (start of graph) after 3s of inactivity
  const [scrubPercent, setScrubPercent] = useState<number | null>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrub = (percent: number | null) => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (percent === null) {
      // If user releases touch, immediately trigger the 3-second return to 00:00
      idleTimerRef.current = setTimeout(() => {
        setScrubPercent(0);
      }, 3000);
    } else {
      setScrubPercent(percent);
      // Also trigger if they stop moving but keep hold (optional safety)
      idleTimerRef.current = setTimeout(() => {
        setScrubPercent(0);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Centralized Display Context for Tomorrow
  const displayContext = useMemo(() => {
    // Start with tomorrow's date at the ticking real-time clock
    let referenceDate = new Date(realTime);
    referenceDate.setDate(referenceDate.getDate() + 1);

    // Apply scrub percent to compute tomorrow's virtual time (defaults to 00:00 if scrubPercent is 0)
    const effectiveScrub = scrubPercent !== null ? scrubPercent : 0;
    const totalMinutes = Math.floor(effectiveScrub * 1439);
    const vHour = Math.floor(totalMinutes / 60);
    const vMin = totalMinutes % 60;
    referenceDate.setHours(vHour, vMin, 0, 0);

    const info = getStatusInfo(tomorrowQueueStr, referenceDate);

    return {
      referenceDate,
      isVirtual: true, // It is always a plan / virtual time on tomorrow's page
      isPast: false,   // No past state on tomorrow's plan
      isOn: info.isCurrentlyOn,
      timeH: info.h,
      timeM: info.m,
      nextChangeHour: info.nextChangeHour
    };
  }, [realTime, scrubPercent, tomorrowQueueStr]);

  // Pointer position percent (defaults to 0%)
  const pointerPercent = (scrubPercent !== null ? scrubPercent : 0) * 100;
  
  // Active slot index (0 - 47) for styling AlternativeTimeline capsules
  const activeSlot = Math.max(0, Math.min(47, Math.floor((scrubPercent !== null ? scrubPercent : 0) * 48)));

  // Message in news feed
  const bannerMessage = tomorrowScheduleData?.message || "Дані ще не надійшли";

  return (
    <div className={clsx("page-home page-tomorrow", !displayContext.isOn && "status-off")}>
      <section id="home-section" className="animate-in fade-in duration-700">
        

        {/* Hero Card for Tomorrow */}
        <HeroCard 
          isOn={displayContext.isOn}
          timeH={displayContext.timeH}
          timeM={displayContext.timeM}
          nextChangeHour={displayContext.nextChangeHour}
          queuesStr={tomorrowQueueStr}
          currentTimePercent={pointerPercent}
          isVirtual={displayContext.isVirtual}
        />

        {/* Customized News Marquee */}
        <MarqueeBanner 
          isOn={displayContext.isOn} 
          customMessage={bannerMessage}
        />

        {/* Dashboard Date/Clock */}
        <DashboardBar 
          isOn={displayContext.isOn} 
          realTime={displayContext.referenceDate} 
          isVirtual={displayContext.isVirtual}
          isPast={displayContext.isPast}
        />

        {/* Subqueue Selector */}
        <SubqueueSelector />

        {/* Interactive Tomorrow Timeline */}
        <AlternativeTimeline 
          queuesStr={tomorrowQueueStr} 
          activeSlot={activeSlot}
          currentRealSlot={-1} // Pass -1 to completely disable dimming of past time slots
          onScrub={handleScrub}
          pointerPercent={pointerPercent}
        />

      </section>
    </div>
  );
};
