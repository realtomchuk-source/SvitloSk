import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import type { QueueStats } from '../types/archive';

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

  // Helper to format slot index to HH:MM string
  const formatSlotToTime = (slot: number) => {
    const totalMinutes = slot * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Determine boundary states for 00:00 and 24:00
  const isStartLit = normalizedBitstring[0] === '1';
  const isEndLit = normalizedBitstring[47] === '1';

  return (
    <div className="mini-slider-row" style={{ padding: '0px', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Subqueue title & stats side-by-side (Comfortable buffer spacing) */}
      <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
        <span 
          className="text-zinc-800 dark:text-zinc-200"
          style={{ 
            fontSize: '11px', 
            fontWeight: 900, 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase' 
          }}
        >
          ПІДЧЕРГА {queueId}
        </span>
        <div 
          className="flex items-center" 
          style={{ 
            gap: '10px', 
            fontSize: '11px', 
            fontWeight: 900, 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase' 
          }}
        >
          <div className="flex items-center" style={{ gap: '4px', color: '#EE7221' }}>
            <span 
              style={{ 
                width: '5px', 
                height: '5px', 
                borderRadius: '50%', 
                backgroundColor: '#EE7221', 
                display: 'inline-block', 
                boxShadow: '0 0 4px #EE7221' 
              }} 
            />
            <span>{calculatedStats.hoursOn} ГОД</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700 opacity-30 font-normal">|</span>
          <div className="flex items-center" style={{ gap: '4px', color: '#374151' }}>
            <span 
              style={{ 
                width: '5px', 
                height: '5px', 
                borderRadius: '50%', 
                backgroundColor: '#374151', 
                display: 'inline-block' 
              }} 
            />
            <span>{calculatedStats.hoursOff} ГОД</span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Timeline Area with dynamic labels & external indicators */}
      <div style={{ position: 'relative', width: '100%', padding: '16px 0 16px' }}>
        
        {/* ABOVE TRACK: ON labels & ticks (height 16px) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16px', pointerEvents: 'none' }}>
          {/* Start label at 00:00 (if light) */}
          {isStartLit && (
            <span style={{ position: 'absolute', left: 0, top: 0, color: '#EE7221', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
              00:00
            </span>
          )}
          
          {/* Transitions to ON (Tick & Label) */}
          {transitions.map(tr => {
            if (tr.type !== 'on') return null;
            const leftPercent = (tr.slot / 48) * 100;
            return (
              <React.Fragment key={`on-group-${tr.slot}`}>
                {/* Visual Tick line going up from track top edge */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${leftPercent}%`, 
                    bottom: 0, 
                    transform: 'translateX(-50%)', 
                    width: '1.2px', 
                    height: '6px', 
                    backgroundColor: '#EE7221',
                    opacity: 0.8
                  }} 
                />
                {/* Time Label sitting right above the tick line */}
                <span 
                  style={{ 
                    position: 'absolute', 
                    left: `${leftPercent}%`, 
                    top: 0,
                    transform: 'translateX(-50%)', 
                    color: '#EE7221', 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    letterSpacing: '0.05em',
                    lineHeight: 1
                  }}
                >
                  {formatSlotToTime(tr.slot)}
                </span>
              </React.Fragment>
            );
          })}

          {/* End label at 24:00 (if light) */}
          {isEndLit && (
            <span style={{ position: 'absolute', right: 0, top: 0, color: '#EE7221', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
              24:00
            </span>
          )}
        </div>

        {/* THE MONOLITHIC TRACK (100% Homogeneous, no internal markings) */}
        <div 
          className="flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-full relative overflow-hidden" 
          style={{ height: '8px', padding: 0 }}
        >
          {Array.from({ length: 48 }).map((_, i) => {
            const isLit = normalizedBitstring[i] === '1';
            return (
              <div
                key={i}
                className={clsx(
                  "flex-1 h-full transition-colors duration-150",
                  isLit 
                    ? "bg-[#EE7221]" 
                    : "bg-[#374151]"
                )}
              />
            );
          })}
        </div>

        {/* BELOW TRACK: OFF labels & ticks (height 16px) */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '16px', pointerEvents: 'none' }}>
          {/* Start label at 00:00 (if outage) */}
          {!isStartLit && (
            <span style={{ position: 'absolute', left: 0, bottom: 0, color: '#374151', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
              00:00
            </span>
          )}
          
          {/* Transitions to OFF (Tick & Label) */}
          {transitions.map(tr => {
            if (tr.type !== 'off') return null;
            const leftPercent = (tr.slot / 48) * 100;
            return (
              <React.Fragment key={`off-group-${tr.slot}`}>
                {/* Visual Tick line going down from track bottom edge */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${leftPercent}%`, 
                    top: 0, 
                    transform: 'translateX(-50%)', 
                    width: '1.2px', 
                    height: '6px', 
                    backgroundColor: '#374151',
                    opacity: 0.6
                  }} 
                />
                {/* Time Label sitting right below the tick line */}
                <span 
                  style={{ 
                    position: 'absolute', 
                    left: `${leftPercent}%`, 
                    bottom: 0,
                    transform: 'translateX(-50%)', 
                    color: '#374151', 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    letterSpacing: '0.05em',
                    lineHeight: 1
                  }}
                >
                  {formatSlotToTime(tr.slot)}
                </span>
              </React.Fragment>
            );
          })}

          {/* End label at 24:00 (if outage) */}
          {!isEndLit && (
            <span style={{ position: 'absolute', right: 0, bottom: 0, color: '#374151', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em', lineHeight: 1 }}>
              24:00
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
