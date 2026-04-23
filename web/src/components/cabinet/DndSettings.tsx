import React from 'react';
import { useStore } from '@/store/useStore';
import { Moon, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export const DndSettings: React.FC = () => {
  const { userConfig, updateUserConfig } = useStore();
  const { dnd } = userConfig;

  const handleToggle = () => {
    updateUserConfig({ dnd: { ...dnd, active: !dnd.active } });
  };

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    updateUserConfig({ dnd: { ...dnd, [field]: value } });
  };

  return (
    <div className="bg-zinc-900 border border-white/5 p-5 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-xl",
            dnd.active ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500"
          )}>
            <Moon size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Не турбувати</h4>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Режим тиші</p>
          </div>
        </div>
        
        <button 
          onClick={handleToggle}
          className={clsx(
            "w-12 h-6 rounded-full p-1 transition-colors duration-300",
            dnd.active ? "bg-purple-600" : "bg-zinc-700"
          )}
        >
          <div className={clsx(
            "w-4 h-4 bg-white rounded-full transition-transform duration-300",
            dnd.active ? "translate-x-6" : "translate-x-0"
          )} />
        </button>
      </div>

      <div className={clsx(
        "flex items-center gap-4 transition-opacity duration-300",
        !dnd.active && "opacity-30 pointer-events-none"
      )}>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Початок</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="time" 
              value={dnd.start}
              onChange={(e) => handleTimeChange('start', e.target.value)}
              className="w-full bg-zinc-800 border-none rounded-xl py-2 pl-9 pr-3 text-sm font-mono focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Кінець</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="time" 
              value={dnd.end}
              onChange={(e) => handleTimeChange('end', e.target.value)}
              className="w-full bg-zinc-800 border-none rounded-xl py-2 pl-9 pr-3 text-sm font-mono focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
