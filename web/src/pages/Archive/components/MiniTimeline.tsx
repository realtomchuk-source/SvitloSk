import React, { useState, useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import type { OutageInterval, QueueStats } from '../types/archive';

interface MiniTimelineProps {
  queueId: string; // e.g. "3.1"
  bitstring: string; // 48 characters of '0' or '1'
  stats?: QueueStats; // Pre-calculated stats from database
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  queueId,
  bitstring,
  stats
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedBitstring = useMemo(() => {
    if (bitstring.length === 48) return bitstring;
    if (bitstring.length === 24) {
      return bitstring.split('').map(char => char.repeat(2)).join('');
    }
    return '1'.repeat(48);
  }, [bitstring]);

  const calculatedStats = useMemo(() => {
    if (stats) return stats;
    let onSegments = 0;
    let offSegments = 0;
    for (const char of normalizedBitstring) {
      if (char === '1') onSegments++;
      else offSegments++;
    }
    return {
      hoursOn: onSegments * 0.5,
      hoursOff: offSegments * 0.5
    };
  }, [stats, normalizedBitstring]);

  const outageIntervals = useMemo((): OutageInterval[] => {
    const intervals: OutageInterval[] = [];
    let isInsideOutage = false;
    let startSlot = 0;

    const toTimeStr = (slot: number) => {
      const h = Math.floor(slot / 2);
      const m = (slot % 2) * 30;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    for (let i = 0; i < 48; i++) {
      const bit = normalizedBitstring[i];
      if (bit === '0' && !isInsideOutage) {
        isInsideOutage = true;
        startSlot = i;
      } else if (bit === '1' && isInsideOutage) {
        isInsideOutage = false;
        intervals.push({
          start: toTimeStr(startSlot),
          end: toTimeStr(i),
          type: 'outage'
        });
      }
    }

    if (isInsideOutage) {
      intervals.push({
        start: toTimeStr(startSlot),
        end: '24:00',
        type: 'outage'
      });
    }

    return intervals;
  }, [normalizedBitstring]);

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX,
        y: rect.top - 8
      });
      setHoveredIdx(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const getCapsuleTimeLabel = (idx: number) => {
    const startHour = Math.floor(idx / 2);
    const startMin = (idx % 2) * 30;
    const endTotalMinutes = (idx + 1) * 30;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    
    return `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  const transitions = useMemo(() => {
    const trans: Array<{ slot: number; type: 'on' | 'off' }> = [];
    for (let i = 1; i < 48; i++) {
      if (normalizedBitstring[i] !== normalizedBitstring[i - 1]) {
        trans.push({
          slot: i,
          type: normalizedBitstring[i] === '1' ? 'on' : 'off'
        });
      }
    }
    return trans;
  }, [normalizedBitstring]);

  return (
    <div className="mini-slider-row" style={{ padding: '4px 16px 2px' }}>
      {/* Subqueue title & stats side-by-side */}
      <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
        <span className="text-[11px] font-black text-orange-500 tracking-wider">ПІДЧЕРГА {queueId}</span>
        <div className="flex gap-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          <span>💡 {calculatedStats.hoursOn} год</span>
          <span className="opacity-25">|</span>
          <span className={clsx(calculatedStats.hoursOff > 0 && "text-red-500 dark:text-red-400")}>
            🔌 {calculatedStats.hoursOff} год
          </span>
        </div>
      </div>

      {/* Sleek Segmented Line Track (Height 8px, rounded, overflow hidden) */}
      <div 
        ref={containerRef}
        className="flex gap-[0.5px] items-center bg-zinc-200 dark:bg-zinc-800 rounded-full relative overflow-hidden" 
        style={{ height: '8px', padding: 0 }}
      >
        {Array.from({ length: 48 }).map((_, i) => {
          const isLit = normalizedBitstring[i] === '1';
          return (
            <div
              key={i}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={handleMouseLeave}
              className={clsx(
                "flex-1 h-full cursor-pointer transition-colors duration-150",
                isLit 
                  ? "bg-orange-500" 
                  : "bg-zinc-400 dark:bg-zinc-600"
              )}
            />
          );
        })}

        {/* Render transition boundaries / neon splitters */}
        {transitions.map(tr => {
          const leftPercent = (tr.slot / 48) * 100;
          return (
            <div
              key={tr.slot}
              className={clsx(
                "absolute pointer-events-none top-0 bottom-0 w-[1px] z-10",
                tr.type === 'on' ? "bg-orange-400 shadow-[0_0_3px_#f97316]" : "bg-zinc-500"
              )}
              style={{ left: `${leftPercent}%` }}
            />
          );
        })}
      </div>

      {/* Time Axis markings (super compact) */}
      <div className="flex justify-between text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500" style={{ paddingLeft: '2px', paddingRight: '2px', marginTop: '2px' }}>
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      {/* Outage Intervals text list (single line, no card background) */}
      <div className="flex items-start gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400" style={{ marginTop: '4px' }}>
        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap mt-[1px]">
          🔌 ВІДБИВКИ:
        </span>
        {outageIntervals.length === 0 ? (
          <span className="italic text-zinc-400 text-[10px]">Знеструмлень немає ☀️</span>
        ) : (
          <span className="font-mono text-[10px]">
            {outageIntervals.map(interval => `${interval.start}-${interval.end}`).join(', ')}
          </span>
        )}
      </div>

      {/* Scrubber Tooltip */}
      {hoveredIdx !== null && (
        <div 
          className="mini-scrubber-tooltip animate-in fade-in zoom-in-95 duration-100"
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span className="text-[10px] text-zinc-400 block font-mono">{getCapsuleTimeLabel(hoveredIdx)}</span>
          <span className="text-[12px] font-black block mt-0.5" style={{ color: normalizedBitstring[hoveredIdx] === '1' ? '#f97316' : '#9ca3af' }}>
            {normalizedBitstring[hoveredIdx] === '1' ? 'Світло є 💡' : 'Відключення 🔌'}
          </span>
        </div>
      )}
    </div>
  );
};
