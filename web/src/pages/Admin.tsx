import React, { useState, useMemo } from 'react';
import { triggerParserWorkflow, fetchHealthStatus, fetchParserState, fetchPendingResults, approveResult, logAdminAction, fetchSystemStats, fetchAddressRequests } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, BarChart2, Grid3X3, Megaphone, Terminal,
  Play, CheckCircle, RotateCcw, AlertCircle, Clock,
  Shield, Key, ExternalLink, MapPin
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserManagement } from './Admin/UserManagement';
import { AnalyticsDashboard } from './Admin/AnalyticsDashboard';
import { LogsViewer } from './Admin/LogsViewer';
import { Announcements } from './Admin/Announcements';
import { ScheduleEditor } from './Admin/ScheduleEditor';
import { AddressRequests } from './Admin/AddressRequests';
// AuditLogsViewer is rendered inside LogsViewer as a sub-tab
import { useStore } from '@/store/useStore';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

type AdminTab = 'dashboard' | 'users' | 'analytics' | 'editor' | 'announcements' | 'logs' | 'address_requests';

const TAB_CONFIG: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Панель', icon: <LayoutDashboard size={20} /> },
  { id: 'users', label: 'Користувачі', icon: <Users size={20} /> },
  { id: 'analytics', label: 'Аналітика', icon: <BarChart2 size={20} /> },
  { id: 'editor', label: 'Редактор графіків', icon: <Grid3X3 size={20} /> },
  { id: 'announcements', label: 'Оголошення', icon: <Megaphone size={20} /> },
  { id: 'address_requests', label: 'Запити адрес', icon: <MapPin size={20} /> },
  { id: 'logs', label: 'Логи', icon: <Terminal size={20} /> },
];

export const Admin: React.FC = () => {
  const { user, isAuthLoading } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [token, setToken] = useState(localStorage.getItem('sssk_admin_token') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const { data: health } = useQuery({ queryKey: ['admin', 'health'], queryFn: fetchHealthStatus });
  const { data: latestEntry } = useQuery({ queryKey: ['admin', 'latest-entry'], queryFn: fetchParserState });
  const { data: pendingResults, refetch: refetchPending } = useQuery({ queryKey: ['admin', 'pending'], queryFn: fetchPendingResults });
  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchSystemStats, refetchInterval: 60000 });
  const { data: addressRequests } = useQuery({ queryKey: ['admin', 'addressRequests'], queryFn: fetchAddressRequests });

  const pendingRequestsCount = useMemo(() => {
    if (!addressRequests) return 0;
    return addressRequests.filter((r: any) => r.status === 'pending').length;
  }, [addressRequests]);

  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // System status (real data)
  const systemStatus = useMemo(() => {
    const now = Date.now();
    const lastSync = health?.timestamp ? new Date(health.timestamp).getTime() : 0;
    const isSyncFresh = (now - lastSync) < 3600000;

    return [
      { label: 'GitHub Sync', value: isSyncFresh ? 'Норма' : 'Затримка', status: isSyncFresh ? 'ok' : 'warning' },
      { label: 'База даних', value: stats ? 'Онлайн' : 'Очікування', status: stats ? 'ok' : 'pending' },
      { label: 'Парсер', value: health?.version || '—', status: health ? 'ok' : 'pending' },
      { label: 'Користувачів', value: stats?.totalUsers?.toString() || '—', status: stats?.totalUsers ? 'ok' : 'pending' },
    ];
  }, [health, stats]);

  const handleTrigger = async () => {
    if (!token) {
      setShowTokenInput(true);
      return alert('Потрібен GitHub токен. Введіть його внизу бічної панелі.');
    }
    setIsTriggering(true);
    try {
      localStorage.setItem('sssk_admin_token', token);
      await triggerParserWorkflow(token, { source: 'manual' });
      alert('Парсер запущено успішно.');
      await logAdminAction('TRIGGER_PARSER', null, { source: 'manual' });
    } catch (err: any) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveResult(id);
      alert('Графік підтверджено.');
      await logAdminAction('APPROVE_RESULT', id.toString());
      setSelectedVerification(null);
      refetchPending();
    } catch (err: any) {
      alert(`Помилка підтвердження: ${err.message}`);
    }
  };

  // --- Loading ---
  if (isAuthLoading) return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Перевірка доступу...</p>
      </div>
    </div>
  );

  // --- Access Denied ---
  if (!user || user.user_metadata?.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <Shield size={48} className="text-red-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Доступ заборонено</h1>
        <p className="text-gray-500 mb-8 max-w-sm">У вас немає прав адміністратора для доступу до цієї панелі.</p>
        <button onClick={() => window.location.hash = '#/'} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">На головну</button>
      </div>
    );
  }

  // --- Tab title mapping ---
  const tabTitles: Record<AdminTab, string> = {
    dashboard: 'Панель керування',
    users: 'Користувачі',
    analytics: 'Аналітика',
    editor: 'Редактор графіків',
    announcements: 'Оголошення',
    address_requests: 'Запити нових адрес',
    logs: 'Логи системи',
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex overflow-hidden font-sans antialiased">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-800 leading-tight">SvitloSk</h1>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Адмін-панель</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all text-[15px] font-medium",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 font-bold shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <span className={clsx(activeTab === tab.id ? "text-blue-600" : "text-gray-400")}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'logs' && (pendingResults?.length || 0) > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full min-w-[22px] text-center">
                  {pendingResults?.length}
                </span>
              )}
              {tab.id === 'address_requests' && pendingRequestsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full min-w-[22px] text-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer: System Pulse + Token */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* System pulse */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] text-gray-400 font-medium">Система</span>
            <div className="flex items-center gap-1.5">
              <div className={clsx("w-1.5 h-1.5 rounded-full", health?.status === 'ok' ? "bg-emerald-500" : "bg-red-400")} />
              <span className="text-[10px] text-gray-400 font-mono">
                {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>

          {/* Token input (collapsible) */}
          {showTokenInput ? (
            <div className="space-y-1.5">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="GitHub PAT"
                className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-blue-400 font-mono"
              />
              <button
                onClick={() => { localStorage.setItem('sssk_admin_token', token); setShowTokenInput(false); alert('Токен збережено.'); }}
                className="w-full text-[10px] py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Зберегти
              </button>
            </div>
          ) : (
            <button onClick={() => setShowTokenInput(true)} className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors">
              <Key size={10} /> <span>Токен GitHub</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{tabTitles[activeTab]}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Оновити"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleTrigger}
              disabled={isTriggering}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              title="Запустити парсер"
            >
              <Play size={14} fill="currentColor" />
              <span className="hidden sm:inline">Запустити парсер</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1 max-w-[1280px] w-full mx-auto space-y-8">
          {/* --- DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Користувачів" value={stats?.totalUsers?.toLocaleString() || '0'} icon={<Users size={24} />} color="blue" />
                <StatCard label="Поточний графік" value={latestEntry?.target_date || '—'} icon={<BarChart2 size={24} />} color="emerald" />
                <StatCard
                  label="Очікує перевірки"
                  value={(pendingResults?.length || 0).toString()}
                  icon={<Grid3X3 size={24} />}
                  color="amber"
                  highlight={pendingResults && pendingResults.length > 0}
                />
                <StatCard label="Подій за 24г" value={stats?.recentActions?.toString() || '0'} icon={<Clock size={24} />} color="purple" />
              </div>

              {/* System Status */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-800 mb-4">Стан системи</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {systemStatus.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 min-h-[56px] bg-gray-50 rounded-xl border border-gray-100 shadow-inner">
                      <span className="text-sm font-semibold text-gray-500">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-sm font-bold",
                          s.status === 'ok' ? "text-emerald-600" : s.status === 'warning' ? "text-amber-600" : "text-gray-400"
                        )}>{s.value}</span>
                        <div className={clsx("w-2 h-2 rounded-full",
                          s.status === 'ok' ? "bg-emerald-500" : s.status === 'warning' ? "bg-amber-500" : "bg-gray-300"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Verification */}
              {pendingResults && pendingResults.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-amber-600" />
                      <h3 className="text-sm font-semibold text-amber-800">
                        {pendingResults.length} {pendingResults.length === 1 ? 'графік очікує' : 'графіків очікують'} підтвердження
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pendingResults.map((res: any) => (
                      <div key={res.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">Графік #{res.id}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{res.target_date}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{new Date(res.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedVerification(res)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Переглянути
                          </button>
                          <button
                            onClick={() => handleApprove(res.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                          >
                            Підтвердити
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl py-5 px-6 flex items-center gap-3 shadow-sm">
                  <CheckCircle size={20} className="text-emerald-600" />
                  <span className="text-base text-emerald-700 font-semibold">Всі графіки підтверджені</span>
                </div>
              )}
            </div>
          )}

          {/* --- OTHER TABS --- */}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'announcements' && <Announcements />}
          {activeTab === 'editor' && <ScheduleEditor />}
          {activeTab === 'address_requests' && <AddressRequests />}
          {activeTab === 'logs' && <LogsViewer />}
        </div>
      </main>

      {/* Verification Detail Panel (overlay) */}
      {selectedVerification && (
        <VerificationPanel
          result={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onApprove={handleApprove}
          GROUPS={GROUPS}
        />
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const StatCard = ({ label, value, icon, color, highlight }: any) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className={clsx("bg-white border rounded-2xl p-6 shadow-sm transition-all border-gray-150 hover:shadow-md",
      highlight ? "border-amber-300 bg-amber-50/30" : "border-gray-200"
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className={clsx("p-3.5 rounded-xl shrink-0 shadow-sm", colorMap[color])}>{icon}</div>
      </div>
    </div>
  );
};



/** Verification detail panel (slide-over) — light theme */
const VerificationPanel = ({ result, onClose, onApprove, GROUPS }: any) => {
  const [editedData, setEditedData] = useState(result.raw_data || {});
  const handleCellToggle = (group: string, hourIndex: number) => {
    const current = editedData[group] || '1'.repeat(24);
    const bit = current[hourIndex] === '1' ? '0' : '1';
    setEditedData({ ...editedData, [group]: current.substring(0, hourIndex) + bit + current.substring(hourIndex + 1) });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 h-full">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h4 className="text-lg font-bold text-gray-800">Перевірка графіка #{result.id}</h4>
            <p className="text-sm text-gray-500">Дата: {result.target_date} • Отримано: {new Date(result.created_at).toLocaleTimeString('uk-UA')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ExternalLink size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Source image */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Зображення з джерела</h5>
            <div className="bg-gray-100 rounded-lg border border-gray-200 aspect-[4/3] overflow-hidden">
              {result.source_media_url ? (
                <img src={result.source_media_url} alt="Джерело" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                  <AlertCircle size={40} />
                  <span className="text-xs font-medium">Зображення недоступне</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid editor */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Розпізнаний графік (редагувати)</h5>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
              <div className="min-w-[700px] space-y-1">
                {GROUPS.map((group: string) => (
                  <div key={group} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-semibold text-gray-500 font-mono text-right">{group}</span>
                    <div className="flex-1 flex gap-0.5">
                      {(editedData[group] || '1'.repeat(24)).split('').map((bit: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleCellToggle(group, i)}
                          className={clsx(
                            "flex-1 h-6 rounded transition-all border",
                            bit === '1'
                              ? "bg-emerald-400 border-emerald-500"
                              : "bg-gray-200 border-gray-300 hover:bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Скасувати
          </button>
          <button onClick={() => onApprove(result.id)} className="flex-[2] py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
            Підтвердити графік
          </button>
        </footer>
      </div>
    </div>
  );
};
