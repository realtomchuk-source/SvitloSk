import React from 'react';

interface DashboardBarProps {
  isOn: boolean;
  realTime: Date;
  isVirtual?: boolean;
  isPast?: boolean;
}

export const DashboardBar: React.FC<DashboardBarProps> = ({ realTime, isVirtual, isPast }) => {
  const dayStr = realTime.toLocaleDateString('uk-UA', { weekday: 'short' }).toUpperCase();
  const dateNum = realTime.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }); /* Fully format year to 4-digits (e.g. 2026) */
  const timeStr = realTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const secStr = realTime.getSeconds().toString().padStart(2, '0');

  // Styles for History (Past) Mode
  const clockColor = isPast ? '#A1A1AA' : '#000';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'transparent',
      border: 'none',
      padding: '0', /* Removed padding to align date/clock with HeroCard edges */
      margin: '2px 34px 2px 34px', /* Changed margins from 20px to 34px to align with mini-graph content */
      transition: 'all 0.3s ease',
      fontFamily: 'var(--sans)' /* Uses the exact same font as the news feed */
    }}>
      {/* Clock Segment (Left side) */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
        <span style={{ 
          fontSize: '16px', 
          fontWeight: 800, 
          color: clockColor, 
          letterSpacing: '-0.2px', 
          lineHeight: '1',
          transition: 'color 0.3s ease'
        }}>
          {timeStr}
        </span>
        
        {/* Hide seconds in virtual mode to emphasize 'snapshot' nature */}
        {!isVirtual && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#A0A0A0',
            lineHeight: '1',
            fontVariantNumeric: 'tabular-nums',  /* A: однакова ширина кожної цифри */
            display: 'inline-block',             /* B: фіксований block */
            width: '16px',                       /* B: постійна ширина — не змінюється */
            textAlign: 'left',
            marginLeft: '3px'
          }}>
            {secStr}
          </span>
        )}
      </div>

      {/* Date Segment (Right side) */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#FF7A00', letterSpacing: '0.02em' }}>{dayStr}</span>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#1C1C1E', letterSpacing: '0.2px' }}>{dateNum}</span>
      </div>
    </div>
  );
};
