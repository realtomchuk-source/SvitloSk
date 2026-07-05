import React from "react";
import { clsx } from 'clsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import powerOffIcon from '@/assets/power_off.png';
import powerOnIcon from '@/assets/power_on.png';

interface HeroCardProps {
  isOn: boolean;
  timeH: number;
  timeM: number;
  nextChangeHour: number;
  queuesStr: string;
  currentTimePercent: number; // For the pointer
  isVirtual?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  isOn,
  timeH,
  timeM,
  nextChangeHour,
  queuesStr,
  currentTimePercent,
  isVirtual,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tomorrowScheduleData, selectedGroup } = useStore();
  const statusClass = isOn ? 'status-on' : 'status-off';
  const iconSrc = isOn ? powerOffIcon : powerOnIcon;

  // Tomorrow schedule check
  const hasTomorrowData = tomorrowScheduleData !== null;
  const tomorrowQueueStr = tomorrowScheduleData?.queues[selectedGroup];
  const hasTomorrowOutages = tomorrowQueueStr ? tomorrowQueueStr.includes('0') : false;

  // Button Action & Styling
  const isClickable = hasTomorrowData;
  let line1 = '';
  let line2 = '';
  if (!hasTomorrowData) {
    line1 = 'ГРАФІК';
    line2 = 'ЗАВТРА';
  } else if (hasTomorrowOutages) {
    line1 = 'ГРАФІК';
    line2 = 'ЗАВТРА';
  } else {
    line1 = 'ЗАВТРА';
    line2 = 'СВІТЛО';
  }
  
  const buttonClass = (!hasTomorrowData || !hasTomorrowOutages) 
    ? 'btn-pending' 
    : 'btn-active';

  const handleTomorrowClick = () => {
    if (isClickable) {
      navigate('/tomorrow');
    }
  };

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

      {/* TOMORROW SCHEDULE BUTTON */}
      {location.pathname !== '/tomorrow' && (
        <div className="hero-phase-btn-container">
          <button 
            className={clsx("hero-tomorrow-btn", buttonClass)}
            onClick={handleTomorrowClick}
            disabled={!isClickable}
          >
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em' }}>{line1}</span>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', marginTop: '1px' }}>{line2}</span>
          </button>
        </div>
      )}

      {/* HORIZONTAL MINI-GRAPH */}
      <div style={{ gridColumn: '1 / span 3', gridRow: 2, position: 'relative', width: '100%', height: '6px', background: 'transparent', borderRadius: '3px', marginTop: '12px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const isAvailable = queuesStr[Math.floor(i / 2)] === '1';
            const currentSlot = Math.floor((currentTimePercent / 100) * 48);
            const isPast = i < currentSlot;

            let bg = 'var(--color-off, #374151)'; // Future OFF
            if (isAvailable) {
              bg = isPast ? 'var(--color-on-past, rgba(238, 114, 33, 0.50))' : 'var(--color-on, #EE7221)'; // ON
            } else {
              bg = isPast ? 'var(--color-off-past, rgba(55, 65, 81, 0.35))' : 'var(--color-off, #374151)'; // OFF
            }

            return (
              <div 
                key={i} 
                style={{ flex: 1, background: bg, height: '100%', transition: 'background 0.3s ease' }}
              />
            );
          })}
        </div>
        {/* Pure Silver Handle (Match sssk-modern.css) */}
        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: `${currentTimePercent}%`, width: '10px', height: '10px', background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '50%', boxShadow: '0 0 10px #FFFFFF, 0 0 20px rgba(255,255,255,0.4)', zIndex: 5, transition: isVirtual ? 'none' : 'left 0.1s linear' }} />
      </div>
    </div>
  );
};
