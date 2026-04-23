import React from "react";
import { clsx } from 'clsx';
import powerOffIcon from '@/assets/power_off.png';
import powerOnIcon from '@/assets/power_on.png';

interface HeroCardProps {
  isOn: boolean;
  timeH: number;
  timeM: number;
  nextChangeHour: number;
  queuesStr: string;
  currentTimePercent: number; // For the pointer
}

export const HeroCard: React.FC<HeroCardProps> = ({
  isOn,
  timeH,
  timeM,
  nextChangeHour,
  queuesStr,
  currentTimePercent,
}) => {
  const statusClass = isOn ? 'status-on' : 'status-off';
  const iconSrc = isOn ? powerOffIcon : powerOnIcon;

  return (
    <div id="smart-hero" className={clsx('hero-card', statusClass)} style={{ margin: '0 20px', position: 'relative' }}>
      {/* ICON */}
      <div className="hero-icon">
        <img src={iconSrc} alt="Status Icon" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
      </div>

      {/* TEXT BLOCK */}
      <div className="hero-text-block">
        <div className="hero-status">
          {isOn ? 'Світло є' : 'Світла немає'}
        </div>
        <div className="hero-timer">
          {timeH}:{timeM.toString().padStart(2, '0')}
        </div>
        <div className="hero-context hero-context--active">
          {nextChangeHour === 24 ? 'до кінця доби' : `до ${isOn ? 'вимкнення' : 'увімкнення'} о ${nextChangeHour}:00`}
        </div>
      </div>

      {/* PROGRESS CAPSULE */}
      <div className="hero-phase" id="hero-phase-capsule">
        <div className="phase-track"></div>
        <div 
          className="phase-fill" 
          style={{ height: `${((24 - nextChangeHour) / 24) * 100}%` }}
        ></div>
        <div className="phase-dot phase-start"></div>
        <div className="phase-dot phase-end"></div>
        <div 
          className="phase-dot phase-current" 
          style={{ bottom: `${((24 - nextChangeHour) / 24) * 100}%` }}
        ></div>
      </div>

      {/* HORIZONTAL MINI-GRAPH */}
      <div style={{ gridColumn: '1 / span 3', gridRow: 2, position: 'relative', width: '100%', height: '6px', background: '#E8E8ED', borderRadius: '3px', marginTop: '12px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const isAvailable = queuesStr[Math.floor(i / 2)] === '1';
            return (
              <div 
                key={i} 
                style={{ flex: 1, background: isAvailable ? '#FF7A00' : 'transparent', height: '100%' }}
              />
            );
          })}
        </div>
        {/* Pure Silver Handle (Match sssk-modern.css) */}
        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: `${currentTimePercent}%`, width: '10px', height: '10px', background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '50%', boxShadow: '0 0 10px #FFFFFF, 0 0 20px rgba(255,255,255,0.4)', zIndex: 5, transition: 'left 0.1s linear' }} />
      </div>
    </div>
  );
};
