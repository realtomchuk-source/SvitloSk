import React, { useState, useEffect } from 'react';
import { triggerParserWorkflow, fetchHealthStatus, fetchParserState } from '@/services/adminService';
import { 
  LayoutDashboard, Users, Database, Terminal, Settings, 
  Play, ShieldAlert, CheckCircle, RotateCcw, 
  Key, Bell, MessageSquare, Activity, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

type AdminTab = 'dashboard' | 'users' | 'editor' | 'logs' | 'settings';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [token, setToken] = useState(localStorage.getItem('sssk_admin_token') || '');
  const [health, setHealth] = useState<any>(null);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [manualGrid, setManualGrid] = useState<Record<string, string>>(
    Object.fromEntries(GROUPS.map(g => [g, "1".repeat(24)]))
  );
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetchHealthStatus().then(setHealth).catch(console.error);
    fetchParserState().then(setLatestEntry).catch(console.error);
  }, []);

  const handleCellClick = (group: string, hourIndex: number) => {
    const current = manualGrid[group];
    const newStatus = current[hourIndex] === '1' ? '0' : '1';
    const updated = current.substring(0, hourIndex) + newStatus + current.substring(hourIndex + 1);
    setManualGrid({ ...manualGrid, [group]: updated });
  };

  const handleTrigger = async () => {
    if (!token) return alert('Введіть токен!');
    setIsTriggering(true);
    try {
      localStorage.setItem('sssk_admin_token', token);
      await triggerParserWorkflow(token, {
        source: 'manual',
        manual_data: JSON.stringify({
          queues: manualGrid,
          mode: 'schedule',
          date: new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
          message: 'Ручне оновлення через Admin Console'
        })
      });
      alert('Успішно запущено!');
    } catch (err: any) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-white/5 flex flex-col p-4 z-20 text-white">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="p-2 bg-blue-600 rounded-xl">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <h1 className="font-black text-lg tracking-tight">SvitloSk <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-bold uppercase">Admin</span></h1>
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Дашборд" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={18} />} label="Користувачі" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <NavItem icon={<Database size={18} />} label="Редактор графіка" active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} />
          <NavItem icon={<Terminal size={18} />} label="Логи парсера" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <div className="h-[1px] bg-white/5 my-4" />
          <NavItem icon={<Settings size={18} />} label="Налаштування" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
           <div className="flex items-center gap-2 mb-2">
              <div className={clsx("w-2 h-2 rounded-full", health?.status === 'ok' ? "bg-green-500" : "bg-red-500")} />
              <span className="text-[10px] font-black uppercase text-zinc-400">System Status</span>
           </div>
           <p className="text-[11px] text-zinc-500 font-medium leading-tight text-left">
              {health?.status === 'ok' ? 'Усі системи працюють штатно' : 'Помилка підключення до парсера'}
           </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 relative text-white">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 text-left">
            <div>
                <h2 className="text-3xl font-black capitalize">{activeTab === 'dashboard' ? 'Загальний огляд' : activeTab === 'users' ? 'Аналітика користувачів' : activeTab === 'editor' ? 'Ручне керування' : activeTab}</h2>
                <p className="text-zinc-500 text-sm mt-1">Остання перевірка: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all"
                >
                    <RotateCcw size={20} />
                </button>
                <button 
                  onClick={handleTrigger}
                  disabled={isTriggering}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                    <Play size={18} />
                    Запустити парсер
                </button>
            </div>
        </header>

        {/* Tab Contents */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500 text-left">
                <StatCard icon={<Activity className="text-blue-500" />} label="Версія парсера" value={health?.version || '2.1-Adaptive'} />
                <StatCard icon={<CheckCircle className="text-green-500" />} label="Останній графік" value={latestEntry?.target_date || '—'} />
                <StatCard icon={<Users className="text-purple-500" />} label="Активні сесії (EST)" value="1,248" />
                
                <div className="md:col-span-2 bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><Bell size={20} className="text-amber-500" /> Останні анонси</h3>
                    <div className="space-y-4">
                        {latestEntry?.announcements?.length > 0 ? latestEntry.announcements.map((ann: any, i: number) => (
                            <div key={i} className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                                <p className="text-sm text-zinc-300 italic text-left">"{ann.text}"</p>
                            </div>
                        )) : (
                            <p className="text-zinc-600 text-sm italic text-left">Анонсів не виявлено</p>
                        )}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><Settings size={20} className="text-zinc-500" /> Швидкі дії</h3>
                    <div className="flex flex-col gap-2">
                        <ActionButton label="Скинути кеш" />
                        <ActionButton label="Оновити історію" />
                        <ActionButton label="Перевірити OCR" />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="animate-in fade-in duration-500">
                <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/50">
                                <th className="p-6 text-xs font-black uppercase text-zinc-500">Пристрій ID</th>
                                <th className="p-6 text-xs font-black uppercase text-zinc-500">Активність</th>
                                <th className="p-6 text-xs font-black uppercase text-zinc-500">Черга</th>
                                <th className="p-6 text-xs font-black uppercase text-zinc-500">Локації</th>
                                <th className="p-6 text-xs font-black uppercase text-zinc-500">Версія</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {[1,2,3,4,5].map(i => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6 font-mono text-zinc-400">UUID-{Math.random().toString(36).substring(7).toUpperCase()}</td>
                                    <td className="p-6 text-zinc-300">Щойно</td>
                                    <td className="p-6 font-bold text-blue-500">{(i % 6 + 1) + '.1'}</td>
                                    <td className="p-6 text-zinc-300">{i % 2 + 1}</td>
                                    <td className="p-6"><span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold">3.0.12</span></td>
                                </tr>
                            ))}
                            <tr className="bg-zinc-950/50">
                                <td colSpan={5} className="p-10 text-center text-zinc-600 italic">
                                   Mock data: Для перегляду реальних користувачів підключіть Supabase або Firebase.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'editor' && (
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 animate-in fade-in duration-500 text-left">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Database size={22} className="text-blue-500" /> Manual Grid Editor</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setManualGrid(Object.fromEntries(GROUPS.map(g => [g, "1".repeat(24)])))}
                            className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                        >
                            <RotateCcw size={14} className="inline mr-2" /> Скинути
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        <div className="flex mb-4">
                            <div className="w-16" />
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="flex-1 text-[10px] font-mono text-center text-zinc-600">
                                    {i.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-1">
                            {GROUPS.map(group => (
                                <div key={group} className="flex items-center gap-1">
                                    <div className="w-16 text-sm font-bold text-zinc-500">{group}</div>
                                    {manualGrid[group].split('').map((bit, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleCellClick(group, i)}
                                            className={clsx(
                                                "flex-1 h-10 rounded-md transition-all",
                                                bit === '1' ? "bg-blue-600/30 hover:bg-blue-500 ring-1 ring-blue-500/20" : "bg-zinc-800 hover:bg-zinc-700"
                                            )}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'logs' && (
            <div className="bg-black p-6 rounded-[2.5rem] border border-white/5 font-mono text-sm h-[600px] overflow-y-auto flex flex-col gap-1 animate-in fade-in duration-500 shadow-2xl text-left">
                <div className="text-green-500 mb-4">[SYSTEM] Initializing stream...</div>
                <div className="text-zinc-500">2026-04-23 15:08:27,831 [INFO] SSSK-Main: Starting scan...</div>
                <div className="text-zinc-500">2026-04-23 15:08:29,120 [INFO] SiteParser: Checking hoe.com.ua...</div>
                <div className="text-zinc-500">2026-04-23 15:08:31,445 [SUCCESS] OCR: Schedule for 24.04 detected.</div>
                <div className="text-blue-400">2026-04-23 15:08:32,010 [DEPLOY] JSON updated in web/public/data.</div>
                <div className="text-amber-500">2026-04-23 15:08:35,550 [WARNING] Health: High latency in News Scraper.</div>
                <div className="mt-auto animate-pulse text-green-500">_</div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="max-w-2xl flex flex-col gap-6 animate-in fade-in duration-500 text-left">
                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><Key size={20} className="text-amber-500" /> GitHub Configuration</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block text-left">Personal Access Token</label>
                            <input 
                                type="password" 
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="ghp_..."
                                className="w-full bg-zinc-800 border-2 border-white/5 rounded-2xl p-4 text-sm font-mono focus:border-blue-500 outline-none transition-all text-white"
                            />
                        </div>
                        <button 
                          onClick={() => { localStorage.setItem('sssk_admin_token', token); alert('Збережено!'); }}
                          className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all text-white"
                        >
                            Зберегти токен локально
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><MessageSquare size={20} className="text-blue-500" /> Глобальне повідомлення</h3>
                    <textarea 
                        className="w-full bg-zinc-800 border-2 border-white/5 rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:border-blue-500 transition-all mb-4 text-white"
                        placeholder="Введіть текст для всіх користувачів..."
                    />
                    <button className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white">Опублікувати повідомлення</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
    )}
  >
    <div className="flex items-center gap-3 font-bold text-sm">
      {icon}
      <span>{label}</span>
    </div>
    <ChevronRight size={14} className={clsx("transition-transform", active ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
  </button>
);

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] text-left">
    <div className="p-3 bg-zinc-800 w-fit rounded-2xl mb-6">
      {icon}
    </div>
    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const ActionButton = ({ label }: { label: string }) => (
  <button className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-750 transition-all w-full">
    <span className="text-xs font-bold text-zinc-400">{label}</span>
    <ChevronRight size={14} className="text-zinc-600" />
  </button>
);
