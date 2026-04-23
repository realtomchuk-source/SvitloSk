import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';

interface TimelineProps {
  scheduleString: string;
}

export const Timeline: React.FC<TimelineProps> = ({ scheduleString }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  const segments = useMemo(() => {
    // Generate 48 segments for 24 hours
    return Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const isOn = scheduleString[hour] === '1';
      return {
        id: i,
        hour,
        minute: (i % 2) * 30,
        isOn,
      };
    });
  }, [scheduleString]);

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentSegment = currentHour * 2 + (currentMinute >= 30 ? 1 : 0);

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Добовий графік</h3>
        <div className="text-2xl font-mono font-bold text-blue-500">
          {hoverIndex !== null 
            ? `${Math.floor(hoverIndex / 2)}:${(hoverIndex % 2) * 30 === 0 ? '00' : '30'}`
            : 'Зараз'}
        </div>
      </div>

      <div 
        className="flex h-16 gap-[2px] items-center group"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {segments.map((seg, i) => (
          <div
            key={seg.id}
            onMouseEnter={() => setHoverIndex(i)}
            className={clsx(
              "flex-1 rounded-sm transition-all duration-300",
              seg.isOn ? "bg-blue-500/40" : "bg-zinc-800",
              i === currentSegment && "h-full bg-white ring-4 ring-white/20 z-10",
              i !== currentSegment && "h-3/4 hover:h-full hover:bg-blue-400",
              hoverIndex === i && "h-full bg-blue-300"
            )}
          />
        ))}
      </div>

      <div className="flex justify-between mt-4 text-[10px] font-mono text-zinc-600 px-1">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
};
