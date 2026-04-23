import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { clsx } from 'clsx';

export const Home: React.FC = () => {
  const { selectedGroup, scheduleData } = useStore();
  const [status, setStatus] = useState(getStatusInfo(scheduleData?.queues[selectedGroup] || "1".repeat(24)));
  const [realTime, setRealTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
      if (scheduleData?.queues[selectedGroup]) {
        setStatus(getStatusInfo(scheduleData.queues[selectedGroup]));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduleData, selectedGroup]);

  const isOn = status.isCurrentlyOn;

  return (
    <section id="home-section" className="animate-in fade-in duration-700">
      <div className="pwa-page-label">STARKON СВІТЛО</div>

      {/* Original Hero Card Structure */}
      <div id="smart-hero" className={clsx("hero-card", isOn ? "status-on" : "status-off")}>
        <div className="hero-icon">
          <img 
            src={isOn ? "assets/power_off.png" : "assets/power_on.png"} 
            alt="Status Icon" 
          />
        </div>

        <div className="hero-text-block">
          <div className="hero-status">{isOn ? 'Світло є' : 'Світла немає'}</div>
          <div className="hero-timer">{status.h}:{status.m.toString().padStart(2, '0')}</div>
          <div className="hero-context hero-context--active">
            до {isOn ? 'вимкнення' : 'увімкнення'} о {status.nextChangeHour}:00
          </div>
        </div>

        {/* Progress Capsule */}
        <div className="hero-phase" id="hero-phase-capsule">
          <div className="phase-track"></div>
          <div className="phase-fill" style={{ height: `${((24 - status.nextChangeHour) / 24) * 100}%` }}></div>
          <div className="phase-dot phase-start"></div>
          <div className="phase-dot phase-end"></div>
          <div className="phase-dot phase-current" style={{ bottom: `${((24 - status.nextChangeHour) / 24) * 100}%` }}></div>
        </div>

        {/* Mini-Graph Placeholder (Original Style) */}
        <div className="hero-timeline-capsule">
          <div className="hero-tl-track">
            <div className="hero-tl-segments flex gap-[1px]">
              {Array.from({ length: 48 }).map((_, i) => {
                const hour = Math.floor(i / 2);
                const segOn = (scheduleData?.queues[selectedGroup] || "1".repeat(24))[hour] === '1';
                return (
                  <div key={i} className={clsx("flex-1 h-full rounded-sm", segOn ? "bg-orange-500/80" : "bg-zinc-700/50")} />
                );
              })}
            </div>
            <div 
              className="hero-tl-pointer" 
              style={{ left: `${((realTime.getHours() * 60 + realTime.getMinutes()) / 1440) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard Block */}
      <div id="dynamic-info-block" className={clsx("dash-container", isOn ? "status-on" : "status-off")}>
        <div className="dash-segment dash-date">
          <span className="dash-day">{realTime.toLocaleDateString('uk-UA', { weekday: 'short' }).toUpperCase()}</span>
          <span className="dash-date-num">{realTime.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>

        <div className="dash-segment dash-clock">
          <span>{realTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="dash-clock-sec">{realTime.getSeconds().toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      {/* Spacer for original layout */}
      <div style={{ height: '20px' }} />
    </section>
  );
};
