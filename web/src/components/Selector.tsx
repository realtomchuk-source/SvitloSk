import React from 'react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];

export const Selector: React.FC = () => {
  const { selectedGroup, setSelectedGroup, scheduleData } = useStore();

  const getStatus = (g: string) => {
    const hour = new Date().getHours();
    return scheduleData?.queues[g]?.[hour] === '1';
  };

  return (
    <div className="selector-wrap" style={{ marginTop: '20px' }}>
      <div className="selector-container overflow-x-auto no-scrollbar">
        <div className="selector-scroll flex gap-3 px-8">
          {GROUPS.map((group) => (
            <div
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={clsx(
                "selector-card",
                selectedGroup === group && "active"
              )}
              style={{ flexShrink: 0, cursor: 'pointer' }}
            >
              <div className="flex flex-col items-center">
                 <div className={clsx("status-dot mb-1", getStatus(group) ? "on" : "off")} style={{ width: '6px', height: '6px' }} />
                 <span className="selector-num">{group}</span>
                 <span className="selector-label text-[8px] uppercase opacity-50">підчерга</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
