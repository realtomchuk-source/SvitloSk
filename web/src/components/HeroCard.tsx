import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import { clsx } from 'clsx';
import { Power, PowerOff, Info } from 'lucide-react';

export const HeroCard: React.FC = () => {
  const { selectedGroup, scheduleData } = useStore();
  const [status, setStatus] = useState(getStatusInfo(scheduleData?.queues[selectedGroup] || "1".repeat(24)));

  useEffect(() => {
    const timer = setInterval(() => {
      if (scheduleData?.queues[selectedGroup]) {
        setStatus(getStatusInfo(scheduleData.queues[selectedGroup]));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduleData, selectedGroup]);

  const isOn = status.isCurrentlyOn;

  return (
    <div className={clsx(
      "relative w-full max-w-md p-6 rounded-[2rem] transition-all duration-500 overflow-hidden",
      isOn ? "bg-blue-600 shadow-[0_20px_50px_rgba(37,99,235,0.3)]" : "bg-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
    )}>
      {/* Background Bulb Effect */}
      <div className={clsx(
        "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20",
        isOn ? "bg-yellow-300" : "bg-zinc-500"
      )} />

      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-4xl font-black mb-1">
            {isOn ? 'Світло є' : 'Світла немає'}
          </h2>
          <p className="text-white/70 font-medium">
            Черга {selectedGroup}
          </p>
        </div>
        <div className={clsx(
          "p-4 rounded-2xl",
          isOn ? "bg-white/20" : "bg-white/5"
        )}>
          {isOn ? <Power size={32} className="text-yellow-300" /> : <PowerOff size={32} className="text-zinc-400" />}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-5xl font-mono font-bold tracking-tighter mb-1">
            {status.h}:{status.m.toString().padStart(2, '0')}
          </div>
          <p className="text-white/60 text-sm">
            до {isOn ? 'вимкнення' : 'увімкнення'} о {status.nextChangeHour}:00
          </p>
        </div>
        
        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <Info size={20} className="text-white/80" />
        </button>
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-8 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white/40 transition-all duration-1000 ease-linear"
          style={{ width: `${((24 - status.nextChangeHour) / 24) * 100}%` }} // Very simple progress logic
        />
      </div>
    </div>
  );
};
