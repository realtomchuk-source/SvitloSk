import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { Timeline } from '@/components/Timeline';
import { GroupSelector } from '@/components/GroupSelector';
import type { Schedule } from '@/schemas/schedule';
import { CalendarClock, AlertCircle, CheckCircle2, BellRing } from 'lucide-react';
import { clsx } from 'clsx';

export const Tomorrow: React.FC = () => {
  const { selectedGroup, userConfig, updateUserConfig } = useStore();
  const [tomorrowData, setTomorrowData] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTomorrow = async () => {
      setLoading(true);
      try {
        const data = await fetchSchedule('tomorrow');
        // Check if the data is actually for tomorrow or just a placeholder
        if (data.mode === 'schedule' || data.queues[selectedGroup]) {
            setTomorrowData(data);
            setError(null);
        } else {
            setError('Графік очікується');
        }
      } catch (err) {
        setError('Дані на завтра відсутні');
      } finally {
        setLoading(false);
      }
    };
    loadTomorrow();
  }, [selectedGroup]);

  const handleTogglePush = () => {
    updateUserConfig({ tomorrowPush: !userConfig.tomorrowPush });
  };

  return (
    <main className="w-full max-w-md flex flex-col gap-6 px-4 pb-20">
      {loading ? (
        <div className="w-full h-80 bg-zinc-900 animate-pulse rounded-[2.5rem]" />
      ) : error || !tomorrowData ? (
        <div className="flex flex-col gap-6">
            <div className="bg-zinc-900 border border-white/5 p-10 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
                <div className="relative">
                    <div className="p-5 bg-zinc-800 rounded-3xl text-zinc-500">
                        <CalendarClock size={48} />
                    </div>
                    <div className="absolute -right-2 -bottom-2 p-2 bg-amber-500 rounded-full border-4 border-zinc-900 text-white">
                        <AlertCircle size={16} />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-black mb-2">Очікуємо графік</h2>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Обленерго зазвичай оприлюднює графік на завтра після 18:00. Ми повідомимо вас, як тільки він з'явиться.
                    </p>
                </div>
            </div>

            {/* Push Notification Toggle for Tomorrow */}
            <button 
                onClick={handleTogglePush}
                className={clsx(
                    "flex items-center justify-between p-6 rounded-3xl transition-all duration-500 border",
                    userConfig.tomorrowPush 
                        ? "bg-blue-600/10 border-blue-500/50" 
                        : "bg-zinc-900 border-white/5"
                )}
            >
                <div className="flex items-center gap-4 text-left">
                    <div className={clsx(
                        "p-3 rounded-2xl",
                        userConfig.tomorrowPush ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"
                    )}>
                        <BellRing size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Пуш на завтра</h4>
                        <p className="text-xs text-zinc-500">Сповістити, коли вийде графік</p>
                    </div>
                </div>
                <div className={clsx(
                    "w-12 h-6 rounded-full p-1 transition-colors",
                    userConfig.tomorrowPush ? "bg-blue-600" : "bg-zinc-700"
                )}>
                    <div className={clsx(
                        "w-4 h-4 bg-white rounded-full transition-transform",
                        userConfig.tomorrowPush ? "translate-x-6" : "translate-x-0"
                    )} />
                </div>
            </button>
        </div>
      ) : (
        <>
          {/* Active Tomorrow Card */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle2 size={120} className="text-blue-500" />
             </div>
             
             <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Графік знайдено</span>
                <span className="text-sm font-bold text-zinc-500">{tomorrowData.date}</span>
             </div>

             <h2 className="text-2xl font-black mb-4 pr-10">
                Графік на завтра готовий
             </h2>
             
             <div className="p-4 bg-black/30 rounded-2xl border border-white/5">
                <p className="text-sm text-zinc-400 italic leading-relaxed">
                    "{tomorrowData.message}"
                </p>
             </div>
          </div>
          
          <Timeline scheduleString={tomorrowData.queues[selectedGroup] || "1".repeat(24)} />
          <GroupSelector />
        </>
      )}
    </main>
  );
};
