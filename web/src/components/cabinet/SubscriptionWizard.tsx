import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Slot } from '@/schemas/user';
import { X, ChevronRight, ChevronLeft, Check, MapPin, Bell, Hash } from 'lucide-react';
import { clsx } from 'clsx';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingSlot?: Slot;
}

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

export const SubscriptionWizard: React.FC<WizardProps> = ({ isOpen, onClose, editingSlot }) => {
  const { addSlot, updateSlot } = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Slot>>(
    editingSlot || {
      locationName: '',
      group: '1.1',
      notifyTime: 10,
      isActive: true,
      dndEnabled: true,
    }
  );

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (editingSlot) {
      await updateSlot(formData as Slot);
    } else {
      await addSlot({
        ...formData,
        id: crypto.randomUUID(),
      } as Slot);
    }
    onClose();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            <span>Крок {step} з 3</span>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold">Назва локації</h3>
            </div>
            <input 
              autoFocus
              type="text"
              placeholder="Наприклад: Дім, Робота, Бабуся"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full bg-zinc-800 border-2 border-white/5 rounded-2xl p-4 text-lg focus:border-blue-500 outline-none transition-all"
            />
            <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
              Це допоможе вам розрізняти сповіщення, якщо у вас кілька адрес.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                <Hash size={24} />
              </div>
              <h3 className="text-xl font-bold">Виберіть підчергу</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, group: g })}
                  className={clsx(
                    "py-3 rounded-xl text-sm font-bold transition-all",
                    formData.group === g 
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" 
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-bold">Час сповіщення</h3>
            </div>
            <div className="flex gap-3">
              {[5, 10, 15, 30].map(mins => (
                <button
                  key={mins}
                  onClick={() => setFormData({ ...formData, notifyTime: mins })}
                  className={clsx(
                    "flex-1 py-4 rounded-2xl text-base font-bold transition-all flex flex-col items-center gap-1",
                    formData.notifyTime === mins 
                      ? "bg-green-600 text-white" 
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750"
                  )}
                >
                  <span>{mins}</span>
                  <span className="text-[10px] uppercase opacity-60">хв</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-12">
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-800 rounded-2xl font-bold text-zinc-400"
            >
              <ChevronLeft size={20} />
              <span>Назад</span>
            </button>
          )}
          
          <button 
            disabled={step === 1 && !formData.locationName}
            onClick={step === 3 ? handleSave : handleNext}
            className={clsx(
              "flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg",
              step === 3 ? "bg-green-600 text-white shadow-green-900/20" : "bg-blue-600 text-white shadow-blue-900/20",
              (step === 1 && !formData.locationName) && "opacity-50 grayscale"
            )}
          >
            <span>{step === 3 ? 'Готово' : 'Далі'}</span>
            {step === 3 ? <Check size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
