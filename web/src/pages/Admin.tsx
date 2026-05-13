import React, { useState, useEffect } from 'react';
import { triggerParserWorkflow, fetchHealthStatus, fetchParserState } from '@/services/adminService';
import { 
  LayoutDashboard, Users, Database, Terminal, Settings, 
  Play, ShieldAlert, CheckCircle, RotateCcw, 
  Key, Bell, MessageSquare, Activity, ChevronRight, BarChart, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserManagement } from './Admin/UserManagement';
import { AnalyticsDashboard } from './Admin/AnalyticsDashboard';
import { LogsViewer } from './Admin/LogsViewer';
import { supabase } from '@/services/supabaseClient';
import { useStore } from '@/store/useStore';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

type AdminTab = 'dashboard' | 'users' | 'analytics' | 'editor' | 'logs' | 'settings';

export const Admin: React.FC = () => {
  const { user, isAuthLoading } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [token, setToken] = useState(localStorage.getItem('sssk_admin_token') || '');
  const [health, setHealth] = useState<any>(null);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [manualGrid, setManualGrid] = useState<Record<string, string>>(
    Object.fromEntries(GROUPS.map(g => [g, "1".repeat(24)]))
  );
  const [isTriggering, setIsTriggering] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (user?.user_metadata?.role !== 'admin') return;
    fetchHealthStatus().then(setHealth).catch(console.error);
    fetchParserState().then(setLatestEntry).catch(console.error);
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const handleCellClick = (group: string, hourIndex: number) => {
    const current = manualGrid[group];
    const newStatus = current[hourIndex] === '1' ? '0' : '1';
    const updated = current.substring(0, hourIndex) + newStatus + current.substring(hourIndex + 1);
    setManualGrid({ ...manualGrid, [group]: updated });
  };

  const handleTrigger = async () => {
    if (!token) return alert('Введіть токен!');
    
    const isValid = Object.values(manualGrid).every(val => val.length === 24);
    if (!isValid) return alert('Помилка: Деякі групи заповнені некоректно!');

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

  const handlePublishAnnouncement = async () => {
    if (!announcementText.trim()) return alert('Введіть текст повідомлення!');
    
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('system_announcements').insert({
        text: announcementText,
        is_active: true
      });
      
      if (error) throw error;
      
      alert('Анонс успішно опубліковано!');
      setAnnouncementText('');
      await fetchAnnouncements();
    } catch (err: any) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleAnnouncement = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      await fetchAnnouncements();
    } catch (err: any) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей анонс?')) return;
    try {
      const { error } = await supabase
        .from('system_announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchAnnouncements();
    } catch (err: any) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const fillGrid = (value: string) => {
    if (!confirm(`Ви впевнені, що хочете заповнити весь графік значенням ${value === '1' ? 'Світло' : 'Вимкнено'}? Це замінить усі поточні дані!`)) {
      return;
    }
    const filled = Object.fromEntries(GROUPS.map(g => [g, value.repeat(24)]));
    setManualGrid(filled);
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center text-white font-bold">
        Завантаження даних безпеки...
      </div>
    );
  }

  if (!user || user.user_metadata?.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-8">
        <div className="p-6 bg-red-600/20 rounded-full mb-6">
          <ShieldAlert size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Доступ заборонено</h1>
        <p className="text-zinc-500 max-w-md">
          Ви намагаєтесь отримати доступ до панелі адміністратора, але ваша облікова запис не має відповідних прав.
        </p>
        <button 
          onClick={() => window.location.hash = '#/'}
          className="mt-8 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-white font-bold transition-all"
        >
          Повернутися на головну
        </button>
      </div>
    );
  }

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
          <NavItem icon={<BarChart size={18} />} label="Аналітика" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
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
           <div className="space-y-1">
              <p className="text-[11px] text-zinc-500 font-medium leading-tight text-left">
                 {health?.status === 'ok' ? '✅ Усі системи працюють штатно' : '❌ Помилка підключення до парсера'}
              </p>
              {health?.version && (
                <p className="text-[10px] text-zinc-600 font-mono text-left">Версія: {health.version}</p>
              )}
              {health?.timestamp && (
                <p className="text-[10px] text-zinc-600 font-mono text-left">Оновлено: {new Date(health.timestamp).toLocaleTimeString()}</p>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto py-12 px-16 pl-32 relative text-white">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 text-left">
            <div>
                <h2 className="text-4xl font-black tracking-tight capitalize">
                  {activeTab === 'dashboard' ? 'Загальний огляд' : 
                   activeTab === 'users' ? 'Управління користувачами' : 
                   activeTab === 'editor' ? 'Редактор графіка' : activeTab}
                </h2>
                <p className="text-zinc-500 text-sm mt-2 font-medium">Остання синхронізація: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                    <RotateCcw size={20} />
                </button>
                <button 
                  onClick={handleTrigger}
                  disabled={isTriggering}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50"
                >
                    <Play size={18} fill="currentColor" />
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
                
                <div className="md:col-span-2 bg-zinc-900 border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><Bell size={24} className="text-amber-500" /> Актуальні анонси</h3>
                    <div className="space-y-4">
                        {announcements.length > 0 && announcements[0].is_active ? (
                            <div className="p-6 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                                <p className="text-base text-blue-100 italic text-left font-medium leading-relaxed">
                                    📢 {announcements[0].text}
                                </p>
                            </div>
                        ) : latestEntry?.announcements?.length > 0 ? (
                            latestEntry.announcements.map((ann: any, i: number) => (
                                <div key={i} className="p-6 bg-zinc-800/50 rounded-2xl border border-white/5">
                                    <p className="text-sm text-zinc-300 italic text-left">"{ann.text}"</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-zinc-600 text-sm italic text-left px-4">Анонсів не виявлено</p>
                        )}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><Settings size={24} className="text-zinc-500" /> Швидкі дії</h3>
                    <div className="flex flex-col gap-3">
                        <ActionButton label="Скинути кеш" />
                        <ActionButton label="Оновити історію" />
                        <ActionButton label="Перевірити OCR" />
                    </div>
                </div>

            </div>
        )}

        {activeTab === 'users' && (
            <div className="animate-in fade-in duration-500">
                <UserManagement />
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-500">
                <AnalyticsDashboard />
            </div>
        )}

        {activeTab === 'editor' && (
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 animate-in fade-in duration-500 text-left">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Database size={22} className="text-blue-500" /> Manual Grid Editor</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => fillGrid('1')}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600/30 transition-all"
                        >
                            Світло (1)
                        </button>
                        <button 
                            onClick={() => fillGrid('0')}
                            className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all"
                        >
                            Вимкнено (0)
                        </button>
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
            <div className="animate-in fade-in duration-500">
                <LogsViewer />
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="max-w-3xl flex flex-col gap-10 animate-in fade-in duration-500 text-left">
                <div className="bg-zinc-900 p-12 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><Key size={24} className="text-amber-500" /> GitHub Configuration</h3>
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 block text-left">Personal Access Token</label>
                            <input 
                                type="password" 
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="ghp_..."
                                className="w-full bg-zinc-850 border border-white/5 rounded-2xl p-5 text-sm font-mono focus:border-blue-500 outline-none transition-all text-white"
                            />
                        </div>
                        <button 
                          onClick={() => { localStorage.setItem('sssk_admin_token', token); alert('Збережено!'); }}
                          className="px-8 py-5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all text-white border border-white/5 shadow-lg"
                        >
                            Зберегти токен локально
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900 p-12 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><MessageSquare size={24} className="text-blue-500" /> Глобальне повідомлення</h3>
                    <div className="flex flex-col gap-6">
                      <div className="relative">
                        <textarea 
                            className="w-full bg-zinc-850 border border-white/5 rounded-3xl p-6 text-sm min-h-[150px] outline-none focus:border-blue-500 transition-all text-white leading-relaxed"
                            placeholder="Введіть текст для всіх користувачів..."
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                        />
                      </div>
                      <button 
                          onClick={handlePublishAnnouncement}
                          disabled={isPublishing}
                          className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                      >
                          {isPublishing ? 'Публікація...' : 'Опублікувати повідомлення'}
                      </button>
                    </div>


                    {announcements.length > 0 && (
                      <div className="mt-8 space-y-3">
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Останні анонси</p>
                        {announcements.map((ann) => (
                          <div key={ann.id} className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className={clsx("text-sm truncate", ann.is_active ? "text-zinc-300" : "text-zinc-600 italic")}>
                                {ann.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                                className={clsx(
                                  "p-2 rounded-lg transition-all",
                                  ann.is_active ? "bg-green-600/20 text-green-400" : "bg-zinc-700 text-zinc-500"
                                )}
                                title={ann.is_active ? "Деактивувати" : "Активувати"}
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button 
                                onClick={() => deleteAnnouncement(ann.id)}
                                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                                title="Видалити"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
  <div className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] text-left hover:bg-zinc-800/50 transition-all shadow-xl">
    <div className="p-4 bg-zinc-800 w-fit rounded-2xl mb-8">
      {icon}
    </div>
    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className="text-3xl font-black text-white tracking-tight">{value}</p>
  </div>
);


const ActionButton = ({ label }: { label: string }) => (
  <button className="flex items-center justify-between p-4 bg-zinc-800 rounded-2xl hover:bg-zinc-750 transition-all w-full">
    <span className="text-xs font-bold text-zinc-400">{label}</span>
    <ChevronRight size={14} className="text-zinc-600" />
  </button>
);
