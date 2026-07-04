import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface AlternativeTimelineProps {
  queuesStr: string;
  activeSlot: number;
  currentRealSlot: number;
  onScrub?: (percent: number | null) => void;
  pointerPercent: number;
}

export const AlternativeTimeline: React.FC<AlternativeTimelineProps> = ({
  queuesStr,
  activeSlot,
  currentRealSlot,
  onScrub,
  pointerPercent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate 25 ticks (0 to 24 hours) for the ruler scale
  const rulerTicks = Array.from({ length: 25 }).map((_, i) => {
    let type: 'major' | 'medium' | 'minor' = 'minor';
    if (i % 6 === 0) {
      type = 'major';
    } else if (i % 3 === 0) {
      type = 'medium';
    }
    return { hour: i, type };
  });

  // Numeric labels at 00, 06, 12, 18, 24
  const scaleLabels = [
    { hour: 0, label: '00:00', positionClass: 'tick-start' },
    { hour: 6, label: '06:00', positionClass: '' },
    { hour: 12, label: '12:00', positionClass: '' },
    { hour: 18, label: '18:00', positionClass: '' },
    { hour: 24, label: '24:00', positionClass: 'tick-end' },
  ];

  // Detect transitions (switches) between hours (1 to 23)
  const breakouts: { hour: number; type: 'on' | 'off' }[] = [];
  for (let i = 1; i < 24; i++) {
    const prev = queuesStr[i - 1];
    const curr = queuesStr[i];
    if (prev !== curr) {
      breakouts.push({
        hour: i,
        type: curr === '1' ? 'on' : 'off',
      });
    }
  }

  // Handle slider interaction (snapping to 48 discrete half-hour intervals)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const percent = val / 48; // Snaps to 48 discrete steps
    
    if (onScrub) {
      onScrub(percent);
    }

    // Reset idle timeout to return to real-time after 5 seconds of inactivity
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    // Play subtle haptic feedback if API is supported
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(8);
    }
  };

  const handleSliderRelease = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    idleTimeoutRef.current = setTimeout(() => {
      if (onScrub) {
        onScrub(null);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  // Determine current active hour and index for grid styling
  const activeHourIdx = Math.floor(activeSlot / 2);

  // Convert pointerPercent (0-100) to slider range value (0-48)
  const sliderValue = Math.round((pointerPercent / 100) * 48);

  return (
    <div className="alt-timeline-container animate-in fade-in duration-500" ref={containerRef}>
      {/* Pointer Line Wrapper to synchronize coordinates with padding */}
      <div className="alt-pointer-wrapper">
        <div 
          className="alt-neon-pointer-line" 
          style={{ left: `${pointerPercent}%` }}
        />
      </div>

      {/* 1. Time scale text labels */}
      <div className="alt-time-scale">
        {scaleLabels.map((item) => {
          const leftPercent = (item.hour / 24) * 100;
          return (
            <div
              key={item.hour}
              className={clsx("alt-scale-tick-label", item.positionClass)}
              style={item.positionClass ? {} : { left: `${leftPercent}%` }}
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {/* 2. Ruler Tick Marks (0 to 24) */}
      <div className="alt-scale-ticks-container">
        {rulerTicks.map((tick) => {
          const leftPercent = (tick.hour / 24) * 100;
          return (
            <div
              key={tick.hour}
              className={clsx(
                "alt-ruler-tick",
                tick.type === 'major' && "major-tick",
                tick.type === 'medium' && "medium-tick",
                tick.type === 'minor' && "minor-tick"
              )}
              style={{ left: `${leftPercent}%` }}
            />
          );
        })}
      </div>

      {/* 3. Breakout Switch Labels: ABOVE (ON / Orange) */}
      <div className="alt-breakouts-top">
        {breakouts
          .filter((b) => b.type === 'on')
          .map((b) => (
            <div
              key={b.hour}
              className="alt-breakout-item on-item"
              style={{ left: `${(b.hour / 24) * 100}%` }}
            >
              <span className="alt-breakout-badge on-badge">{b.hour}:00</span>
              <div className="alt-breakout-tick on-tick" />
            </div>
          ))}
      </div>

      {/* 4. 24-Hour Grid with 30-Min Capsules */}
      <div className="alt-timeline-grid-wrapper">
        <div className="alt-timeline-grid">
          {Array.from({ length: 24 }).map((_, hourIdx) => {
            const isHourOn = queuesStr[hourIdx] === '1';
            
            return (
              <div key={hourIdx} className="alt-timeline-hour">
                {/* Capsule 1: First 30 mins */}
                <div
                  className={clsx(
                    "alt-capsule",
                    isHourOn ? "status-on" : "status-off",
                    (hourIdx * 2 < currentRealSlot) && "is-past",
                    (activeHourIdx === hourIdx && activeSlot % 2 === 0) && "is-active-virtual"
                  )}
                />
                {/* Capsule 2: Second 30 mins */}
                <div
                  className={clsx(
                    "alt-capsule",
                    isHourOn ? "status-on" : "status-off",
                    (hourIdx * 2 + 1 < currentRealSlot) && "is-past",
                    (activeHourIdx === hourIdx && activeSlot % 2 === 1) && "is-active-virtual"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Breakout Switch Labels: BELOW (OFF / Dark Gray) */}
      <div className="alt-breakouts-bottom">
        {breakouts
          .filter((b) => b.type === 'off')
          .map((b) => (
            <div
              key={b.hour}
              className="alt-breakout-item off-item"
              style={{ left: `${(b.hour / 24) * 100}%` }}
            >
              <div className="alt-breakout-tick off-tick" />
              <span className="alt-breakout-badge off-badge">{b.hour}:00</span>
            </div>
          ))}
      </div>

      {/* 6. Touch-Friendly Slider (No Track Line) */}
      <div className="alt-slider-wrapper">
        {/* Bottom Pointer Line Continuation */}
        <div 
          className="alt-neon-pointer-line-bottom"
          style={{ left: `${pointerPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max="48"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="alt-range-input"
        />
      </div>
    </div>
  );
};
