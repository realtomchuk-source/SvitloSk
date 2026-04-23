import React, { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface InteractiveTimelineProps {
  queuesStr: string;
  onScrub?: (slotIndex: number | null) => void;
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ queuesStr, onScrub }) => {
  const SLOTS_COUNT = 48;
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const getCurrentSlot = () => {
    const d = new Date();
    return Math.floor((d.getHours() * 60 + d.getMinutes()) / 30);
  };

  useEffect(() => {
    if (!isDragging && selectedSlot === null) {
      setSelectedSlot(getCurrentSlot());
    }
  }, [isDragging, selectedSlot]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Auto-return after 3 seconds of idle time
    setTimeout(() => {
      setSelectedSlot(null);
      if (onScrub) onScrub(null);
    }, 3000);
  };

  const updatePosition = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    let percent = relativeX / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    
    const snappedSlot = Math.round(percent * SLOTS_COUNT);
    const finalSlot = Math.max(0, Math.min(SLOTS_COUNT - 1, snappedSlot));
    setSelectedSlot(finalSlot);
    if (onScrub) onScrub(finalSlot);
  };

  // If not scrubbing, visually show the current real time slot
  const displaySlot = selectedSlot !== null ? selectedSlot : getCurrentSlot();
  const slotPercent = (displaySlot / (SLOTS_COUNT - 1)) * 100;
  const isSlotAvailable = queuesStr[Math.floor(displaySlot / 2)] === '1';
  
  const h = Math.floor(displaySlot / 2).toString().padStart(2, '0');
  const m = (displaySlot % 2 === 0) ? '00' : '30';
  const timeStr = `${h}:${m}`;
  const label = isSlotAvailable ? 'світло є' : 'світла немає';

  const majorTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div className="section-container timeline-block-v2" style={{ padding: '0 34px', margin: '20px 0' }}>
      
      {/* Light Theme Status Display */}
      <div 
        style={{
          fontSize: '12px',
          color: isSlotAvailable ? '#FF7A00' : '#8E8E93',
          textAlign: 'center',
          padding: '6px 0',
          marginBottom: '10px',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: '600',
        }}
      >
        {timeStr} — {label}
      </div>

      <div 
        className="track-wrap"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          height: '50px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        {/* Scale Ticks - ABOVE track */}
        <div className="scale" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '15px', pointerEvents: 'none' }}>
          {Array.from({ length: 49 }).map((_, i) => {
            const isMajor = majorTicks.includes(i / 2);
            const leftPercent = (i / SLOTS_COUNT) * 100;
            return (
              <React.Fragment key={i}>
                <div 
                  className={clsx("scale__tick", isMajor && "scale__tick--major")}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '1px',
                    height: isMajor ? '8px' : '4px',
                    background: '#C2C5CA',
                    left: `${leftPercent}%`
                  }} 
                />
                {isMajor && (
                  <div 
                    className="scale__label"
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      color: '#8E8E93',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: '500',
                      left: `${leftPercent}%`
                    }}
                  >
                    {(i/2).toString().padStart(2, '0')}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* The Track */}
        <div 
          className="track"
          style={{
            position: 'absolute',
            top: '25px',
            left: 0,
            right: 0,
            height: '14px',
            borderRadius: '7px',
            overflow: 'hidden',
            display: 'flex',
            background: '#E8E8ED',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {Array.from({ length: 48 }).map((_, i) => {
            const isAvailable = queuesStr[Math.floor(i / 2)] === '1';
            return (
              <div 
                key={i} 
                className={clsx("track__segment", isAvailable ? "track__segment--available" : "track__segment--unavailable")}
                style={{ 
                  flex: 1, 
                  background: isAvailable ? '#FF7A00' : 'transparent',
                  height: '100%' 
                }} 
              />
            );
          })}
        </div>

        {/* The Metallic Thumb */}
        <div 
          className={clsx("thumb", isDragging && "thumb--dragging")}
          style={{
            position: 'absolute',
            top: '39px', 
            left: `${slotPercent}%`,
            width: '18px',
            height: '28px',
            background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F7FA 50%, #E6E9EF 100%)',
            border: '1.5px solid #A0AEC0',
            borderRadius: '8px',
            transform: 'translate(-50%, -50%)',
            boxShadow: isDragging 
              ? '0 4px 12px rgba(255, 122, 0, 0.4), 0 0 8px rgba(255,255,255,0.4)' 
              : 'inset 0 1px 2px rgba(255,255,255,1), 0 2px 8px rgba(0,0,0,0.2), 0 0 3px rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            zIndex: 10,
            transition: isDragging ? 'none' : 'left 0.1s ease-out'
          }}
        >
           {/* Inner glowing orange line */}
           <div style={{
               position: 'absolute',
               top: '50%',
               left: '50%',
               width: '6px',
               height: '14px',
               background: '#FF7A00',
               borderRadius: '3px',
               transform: 'translate(-50%, -50%)',
               boxShadow: '0 0 4px #FF7A00',
               zIndex: 2
             }}
           />
           {/* Crosshair Drop line (Time Machine indicator) */}
           <div style={{
             position: 'absolute',
             top: '50%',
             left: '50%',
             width: '1px',
             height: '46px', 
             background: '#C2C5CA',
             transform: 'translate(-50%, -50%)',
             opacity: 1, 
             zIndex: 1
           }} />
        </div>
      </div>
    </div>
  );
};