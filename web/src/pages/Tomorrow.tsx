import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { fetchSchedule, getStatusInfo } from '@/services/scheduleService';
import { Selector } from '@/components/Selector';
import type { Schedule } from '@/schemas/schedule';
import { clsx } from 'clsx';

export const Tomorrow: React.FC = () => {
  const { selectedGroup } = useStore();
  const [tomorrowData, setTomorrowData] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule('tomorrow').then(setTomorrowData).finally(() => setLoading(false));
  }, []);

  const status = getStatusInfo(tomorrowData?.queues[selectedGroup] || "1".repeat(24));
  const isOn = status.isCurrentlyOn;

  return (
    <section id="tomorrow-section" className="animate-in fade-in duration-700">
      <div className="pwa-page-label">ГРАФІК НА ЗАВТРА</div>

      {!tomorrowData && !loading ? (
        <div className="bg-zinc-900/50 p-10 rounded-[2rem] border border-white/5 text-center mx-4">
            <p className="text-zinc-500 italic">Очікуємо публікації графіка на завтра...</p>
        </div>
      ) : (
        <div id="smart-hero" className={clsx("hero-card", isOn ? "status-on" : "status-off")}>
          <div className="hero-icon">
            <img src={isOn ? "assets/power_off.png" : "assets/power_on.png"} alt="Status Icon" />
          </div>

          <div className="hero-text-block">
            <div className="hero-status">Завтра: {isOn ? 'Буде світло' : 'Без світла'}</div>
            <div className="hero-timer">{tomorrowData?.date}</div>
            <div className="hero-context">за уточненим графіком</div>
          </div>

          <div className="hero-timeline-capsule" style={{ marginTop: '30px' }}>
            <div className="hero-tl-track">
              <div className="hero-tl-segments flex gap-[1px]">
                {Array.from({ length: 48 }).map((_, i) => {
                  const hour = Math.floor(i / 2);
                  const segOn = (tomorrowData?.queues[selectedGroup] || "1".repeat(24))[hour] === '1';
                  return (
                    <div key={i} className={clsx("flex-1 h-full rounded-sm", segOn ? "bg-orange-500/80" : "bg-zinc-700/50")} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-container" style={{ padding: '0 34px', marginTop: '20px' }}>
         <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 text-center italic text-zinc-500 text-sm leading-relaxed">
            {tomorrowData?.message || "Графік на завтра зазвичай з'являється після 18:00."}
         </div>
      </div>

      <Selector />
    </section>
  );
};
