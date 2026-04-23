import React from 'react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

export const GroupSelector: React.FC = () => {
  const { selectedGroup, setSelectedGroup, scheduleData } = useStore();

  const getStatusForGroup = (group: string) => {
    const currentHour = new Date().getHours();
    return scheduleData?.queues[group]?.[currentHour] === '1';
  };

  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Вибір черги</h3>
      <div className="grid grid-cols-4 gap-2">
        {GROUPS.map((group) => {
          const isActive = selectedGroup === group;
          const isOn = getStatusForGroup(group);
          
          return (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={clsx(
                "relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border",
                isActive 
                  ? "bg-blue-600 border-blue-500 scale-105 z-10 shadow-lg" 
                  : "bg-zinc-900 border-white/5 hover:border-white/20"
              )}
            >
              <div className={clsx(
                "absolute top-2 right-2 w-1.5 h-1.5 rounded-full",
                isOn ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
              )} />
              <span className={clsx(
                "text-lg font-bold",
                isActive ? "text-white" : "text-zinc-400"
              )}>
                {group}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
