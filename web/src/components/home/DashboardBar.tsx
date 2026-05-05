import React from 'react';

interface DashboardBarProps {
  isOn: boolean;
  realTime: Date;
}

export const DashboardBar: React.FC<DashboardBarProps> = ({ realTime }) => {
  const dayStr = realTime.toLocaleDateString('uk-UA', { weekday: 'short' }).toUpperCase();
  const dateNum = realTime.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = realTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const secStr = realTime.getSeconds().toString().padStart(2, '0');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#FFFFFF',
      borderRadius: '8px',
      padding: '16px 24px',
      margin: '12px 20px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.02)'
    }}>
      {/* Date Segment */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#FF7A00' }}>{dayStr}</span>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1C1C1E', letterSpacing: '0.5px' }}>{dateNum}</span>
      </div>

      {/* Clock Segment */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1px', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#000', letterSpacing: '-0.5px', lineHeight: 1 }}>{timeStr}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', lineHeight: 1, marginTop: '2px' }}>{secStr}</span>
      </div>
    </div>
  );
};
