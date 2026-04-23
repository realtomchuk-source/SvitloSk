import React from 'react';
import { useStore } from '@/store/useStore';
import { DndSettings } from '@/components/cabinet/DndSettings';
import { SlotCard } from '@/components/cabinet/SlotCard';
import { SubscriptionWizard } from '@/components/cabinet/SubscriptionWizard';
import { usePWA } from '@/hooks/usePWA';
import type { Slot } from '@/schemas/user';
import { Settings, BellRing, ShieldCheck, HelpCircle, Share2, Download } from 'lucide-react';
import { clsx } from 'clsx';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

export const Cabinet: React.FC = () => {
  const { slots, userConfig, updateUserConfig } = useStore();
  const { canInstall, install } = usePWA();
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [editingSlot, setEditingSlot] = React.useState<Slot | undefined>(undefined);

  const handleStartGroupChange = (group: string) => {
    updateUserConfig({ startGroup: group });
  };

  const handleEditSlot = (slot?: Slot) => {
    setEditingSlot(slot);
    setWizardOpen(true);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-8 pb-10 px-4">
      {/* Profile Info */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">Локальний режим</h2>
            <p className="text-xs font-medium text-white/70 leading-relaxed">
              Ваші налаштування зберігаються безпечно у внутрішній базі даних браузера.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Slots */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2">
          <BellRing size={16} className="text-blue-500" />
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Сповіщення (Smart Slots)</h3>
        </div>
        <div className="flex flex-col gap-3">
          <SlotCard slot={slots[0]} onEdit={handleEditSlot} />
          <SlotCard slot={slots[1]} onEdit={handleEditSlot} />
        </div>
      </section>

      <SubscriptionWizard 
        isOpen={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        editingSlot={editingSlot} 
      />

      {/* DND Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Settings size={16} className="text-purple-500" />
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Системні налаштування</h3>
        </div>
        <DndSettings />
      </section>

      {/* Start Group Selector */}
      <section className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
        <h3 className="text-sm font-bold mb-4">Стартова черга</h3>
        <div className="grid grid-cols-6 gap-2">
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => handleStartGroupChange(g)}
              className={clsx(
                "py-2 rounded-lg text-xs font-bold transition-all",
                userConfig.startGroup === g 
                  ? "bg-blue-600 text-white" 
                  : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-4 text-center">
          Додаток буде автоматично відкривати цю чергу при запуску
        </p>
      </section>

      {/* Utility Actions */}
      <section className="flex flex-col gap-2">
        {canInstall && (
          <button 
            onClick={install}
            className="flex items-center justify-between p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20 border border-blue-500 mb-2"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-white" />
              <span className="text-sm font-bold text-white">Встановити додаток</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </button>
        )}

        <button className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all">
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-zinc-500" />
            <span className="text-sm font-bold">Допомога та FAQ</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        </button>
        
        <button className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all">
          <div className="flex items-center gap-3">
            <Share2 size={18} className="text-zinc-500" />
            <span className="text-sm font-bold">Поділитися додатком</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        </button>
      </section>
    </div>
  );
};
