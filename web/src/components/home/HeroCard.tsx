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
  nextChangeHour?: number;
  nextChangeFormatted?: string;
  queuesStr: string;
  currentTimePercent: number; // For the pointer
  isVirtual?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  isOn,
  timeH,
  timeM,
  nextChangeHour,
  nextChangeFormatted,
  queuesStr,
  currentTimePercent,
  isVirtual,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tomorrowScheduleData } = useStore();
  const statusClass = isOn ? 'status-on' : 'status-off';
  const iconSrc = isOn ? powerOffIcon : powerOnIcon;

  // Normalized 48-slot string for the mini-graph
  const s48 = queuesStr.length === 48 
    ? queuesStr 
    : queuesStr.split('').map(c => c + c).join('');

  // Target change time string (e.g. "08:30" or "09:00" or fallback to nextChangeHour)
  const changeTimeText = nextChangeFormatted || (nextChangeHour !== undefined ? `${nextChangeHour}:00` : '24:00');
  const isEndOfDay = changeTimeText === '24:00';

  // Check if tomorrow schedule has any outages across all 12 queues (contains '0')
  // AND is strictly for tomorrow's date
  const isTomorrowValidAndHasOutages = React.useMemo(() => {
    if (!tomorrowScheduleData?.queues) return false;
    
    // Validate target date if present
    if (tomorrowScheduleData.date) {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      const tomorrowShort = `${String(tomorrow.getDate()).padStart(2, '0')}.${String(tomorrow.getMonth() + 1).padStart(2, '0')}`;
      
      const scheduleDate = tomorrowScheduleData.date.trim();
      if (scheduleDate !== tomorrowIso && scheduleDate !== tomorrowShort) {
        return false;
      }
    }

    const queuesValues = Object.values(tomorrowScheduleData.queues);
    if (queuesValues.length === 0) return false;
    return queuesValues.some(q => q.includes('0'));
  }, [tomorrowScheduleData]);

  // Tomorrow schedule check: must have tomorrow schedule data AND have outages in 12 queues
  const isTomorrowActive = isTomorrowValidAndHasOutages;
  const isClickable = isTomorrowActive;

  const linkClass = isTomorrowActive ? 'link-active' : 'link-pending';

  const handleTomorrowClick = () => {
    if (isClickable) {
      navigate('/tomorrow');
    }
  };

  return (
    <div id="smart-hero" className={clsx('hero-card', statusClass)} style={{ margin: '0 20px', position: 'relative' }}>
      {/* ICON */}
      <div className="hero-icon">
        <img src={iconSrc} alt="Status Icon" style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', flexShrink: 0, objectFit: 'contain' }} />
      </div>

      {/* TEXT BLOCK */}
      <div className="hero-text-block">
        <div className="hero-status">
          {isOn ? 'Світло є' : 'Світла немає'}
        </div>
        <div className="hero-timer">
          {timeH > 0 && (
            <>
              <span>{timeH}</span>
              <span className="hero-timer-unit">г.</span>
            </>
          )}
          <span>{timeM}</span>
          <span className="hero-timer-unit">хв.</span>
        </div>
        <div className="hero-context hero-context--active">
          {isEndOfDay ? 'до кінця доби' : `до ${isOn ? 'вимкнення' : 'увімкнення'} о ${changeTimeText}`}
        </div>
      </div>

      {/* TOMORROW SCHEDULE LINK */}
      {location.pathname !== '/tomorrow' && (
        <div className="hero-phase-btn-container">
          <button
            type="button"
            className={clsx("hero-tomorrow-link", linkClass)}
            onClick={handleTomorrowClick}
            disabled={!isClickable}
          >
            <span className="hero-tomorrow-link-text">
              <span>Графік</span>
              <span>на завтра</span>
            </span>
            <svg
              className="hero-tomorrow-arrow"
              width="28"
              height="56"
              viewBox="0 0 28 56"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4L10 28L2 52"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.25"
              />
              <path
                d="M10 4L18 28L10 52"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
              <path
                d="M18 4L26 28L18 52"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="1"
              />
            </svg>
          </button>
        </div>
      )}

      {/* HORIZONTAL MINI-GRAPH */}
      <div style={{ gridColumn: '1 / span 3', gridRow: 2, position: 'relative', width: '100%', height: '6px', background: 'transparent', borderRadius: '3px', marginTop: '12px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const isAvailable = s48[i] === '1';
            const currentSlot = Math.floor((currentTimePercent / 100) * 48);
            const isTomorrowPage = location.pathname === '/tomorrow';
            const isPast = isTomorrowPage ? false : (i < currentSlot);

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
