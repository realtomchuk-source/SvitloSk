import React from 'react';
import type { Slot } from '@/schemas/user';
import { useStore } from '@/store/useStore';
import { Bell, MapPin, Trash2, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SlotCardProps {
  slot?: Slot;
  onEdit: (slot?: Slot) => void;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot, onEdit }) => {
  const { deleteSlot } = useStore();

  if (!slot) {
    return (
      <button 
        onClick={() => onEdit()}
        className="w-full aspect-[2/1] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-zinc-700 hover:text-zinc-500 transition-all"
      >
        <div className="p-3 bg-zinc-900 rounded-2xl">
          <MapPin size={24} />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest">Додати локацію</span>
      </button>
    );
  }

  return (
    <div className={clsx(
      "w-full p-5 rounded-3xl border transition-all duration-300",
      slot.isActive ? "bg-zinc-900 border-blue-500/30" : "bg-zinc-900 border-white/5 opacity-60"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="font-bold text-base leading-tight">{slot.locationName}</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Черга {slot.group}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(slot)}
            className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <Settings2 size={18} />
          </button>
          <button 
            onClick={() => deleteSlot(slot.id)}
            className="p-2 bg-zinc-800 rounded-xl text-red-500/70 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          <Bell size={14} className="text-blue-500" />
          <span>за {slot.notifyTime} хв</span>
        </div>
        <div className="h-4 w-[1px] bg-white/5" />
        <div className="text-[10px] font-bold text-zinc-500 uppercase">
          {slot.dndEnabled ? "DND: УВІМК" : "Без DND"}
        </div>
      </div>
    </div>
  );
};
