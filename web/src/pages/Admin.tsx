import React, { useState, useMemo } from 'react';
import { triggerParserWorkflow, fetchHealthStatus, fetchParserState, fetchScheduleTimeline, revokeSchedule, logAdminAction, fetchSystemStats, fetchAddressRequests } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, BarChart2, Grid3X3, Megaphone, Terminal,
  Play, CheckCircle, RotateCcw, AlertCircle, Clock, Ban,
  Shield, Key, ExternalLink, MapPin, LogOut, ArrowUpRight
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
import { BrandIcon } from '@/assets/brand/BrandIcon';

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
  const { user, isAuthLoading, signOut } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [token, setToken] = useState(localStorage.getItem('sssk_admin_token') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const { data: health } = useQuery({ queryKey: ['admin', 'health'], queryFn: fetchHealthStatus });
  const { data: latestEntry } = useQuery({ queryKey: ['admin', 'latest-entry'], queryFn: fetchParserState });
  const { data: scheduleTimeline, refetch: refetchTimeline } = useQuery({ queryKey: ['admin', 'timeline'], queryFn: fetchScheduleTimeline });
  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchSystemStats, refetchInterval: 60000 });
  const { data: addressRequests } = useQuery({ queryKey: ['admin', 'addressRequests'], queryFn: fetchAddressRequests });

  const pendingRequestsCount = useMemo(() => {
    if (!addressRequests) return 0;
    return addressRequests.filter((r: any) => r.status === 'pending').length;
  }, [addressRequests]);

  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // System status (real data)
  const systemStatus = useMemo(() => {
    const now = Date.now();
    const lastSync = health?.timestamp ? new Date(health.timestamp).getTime() : 0;
    const isSyncFresh = (now - lastSync) < 3600000;

    return [
      { label: 'GitHub Sync', value: isSyncFresh ? 'Норма' : 'Затримка', status: isSyncFresh ? 'ok' : 'warning' },
      { label: 'База даних', value: stats ? 'Онлайн' : 'Очікування', status: stats ? 'ok' : 'pending' },
      { label: 'Парсер', value: health ? `${health.version || '2.1-Adaptive'} (Успішно)` : '—', status: health ? 'ok' : 'pending' },
      { label: 'Push Service', value: stats ? 'Онлайн' : 'Очікування', status: stats ? 'ok' : 'pending' },
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

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Ви впевнені, що хочете відкликати цей графік?')) return;
    try {
      await revokeSchedule(id);
      alert('Графік відкликано.');
      await logAdminAction('REVOKE_SCHEDULE', id.toString());
      setSelectedReview(null);
      refetchTimeline();
    } catch (err: any) {
      alert(`Помилка відкликання: ${err.message}`);
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
    <div className="admin-fixed-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <BrandIcon variant="logo" size={24} color="var(--color-orange)" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-800 leading-tight">SvitloSk</h1>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Адмін-панель</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav space-y-1.5">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "admin-nav-btn",
                activeTab === tab.id && "active"
              )}
            >
              <span className={clsx(activeTab === tab.id ? "text-blue-600" : "text-gray-400")}>{tab.icon}</span>
              <span>{tab.label}</span>

              {tab.id === 'address_requests' && pendingRequestsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full min-w-[22px] text-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer: System Pulse + Token */}
        <div className="admin-sidebar-footer space-y-2">
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
      <main className="admin-main-area">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">{tabTitles[activeTab]}</h2>
          </div>
          <div className="admin-header-buttons flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="admin-btn-secondary !py-2 !px-3.5 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              title="Оновити сторінку"
            >
              <RotateCcw size={14} className="text-gray-500" />
              <span className="hidden md:inline text-xs font-bold text-gray-700">Оновити дані</span>
            </button>

            {/* Trigger Parser Button */}
            <button
              onClick={handleTrigger}
              disabled={isTriggering}
              className="admin-btn-primary !py-2 !px-3.5 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Запустити парсер"
            >
              <Play size={14} fill="currentColor" />
              <span className="hidden md:inline text-xs font-bold">Запустити парсер</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                if (window.confirm('Ви впевнені, що хочете вийти з адмін-панелі?')) {
                  await signOut();
                  window.location.hash = '#/';
                }
              }}
              className="admin-btn-danger !py-2 !px-3.5 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              title="Вийти з адмін-панелі"
            >
              <LogOut size={14} />
              <span className="hidden md:inline text-xs font-bold">Вийти</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content-container">
          {/* --- DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Stat Cards */}
              <div className="admin-stats-grid">
                <StatCard label="Користувачів в БД" value={stats?.totalUsers?.toLocaleString() || '0'} icon={<Users size={24} />} color="blue" />
                <StatCard label="Поточний графік" value={latestEntry?.target_date || '—'} icon={<BarChart2 size={24} />} color="emerald" badge="Актуальний" />
                <StatCard 
                  label="Запити адрес" 
                  value={pendingRequestsCount.toString()} 
                  icon={<MapPin size={24} />} 
                  color="purple" 
                  badge={pendingRequestsCount > 0 ? "Очікують" : "Оброблені"}
                  highlight={pendingRequestsCount > 0}
                />
                <StatCard
                  label="Останній графік"
                  value={scheduleTimeline?.[0]?.target_date || '—'}
                  icon={<Grid3X3 size={24} />}
                  color="emerald"
                  badge="Авто ✓"
                />
              </div>

              {/* System Grid Layout containing Status & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                {/* System Status (2 cols) */}
                <div className="admin-system-board lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-4">Стан системи</h3>
                    <div className="admin-system-grid">
                      {systemStatus.map((s, i) => (
                        <div key={i} className="admin-status-box">
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
                </div>

                {/* Quick Actions widget (1 col) */}
                <div className="admin-system-board lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-4">Швидкі дії</h3>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={handleTrigger}
                        disabled={isTriggering}
                        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 transition-all text-xs cursor-pointer group disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2">
                          <Play size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                          Перевірити авто-парсер
                        </span>
                        <ArrowUpRight size={14} className="opacity-50" />
                      </button>

                      <button
                        onClick={() => setActiveTab('editor')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50/50 hover:bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-100 transition-all text-xs cursor-pointer group"
                      >
                        <span className="flex items-center gap-2">
                          <Grid3X3 size={14} className="group-hover:scale-110 transition-transform" />
                          Експорт графіка (PNG)
                        </span>
                        <ArrowUpRight size={14} className="opacity-50" />
                      </button>

                      <button
                        onClick={() => setActiveTab('announcements')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 transition-all text-xs cursor-pointer group"
                      >
                        <span className="flex items-center gap-2">
                          <Megaphone size={14} className="group-hover:scale-110 transition-transform" />
                          Створити оголошення
                        </span>
                        <ArrowUpRight size={14} className="opacity-50" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Timeline */}
              {scheduleTimeline && scheduleTimeline.length > 0 && (() => {
                const latest = scheduleTimeline[0];
                const fmtKyiv = (iso: string | null) => {
                  if (!iso) return '—';
                  return new Date(iso).toLocaleString('uk-UA', {
                    timeZone: 'Europe/Kyiv',
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  });
                };
                const isRevoked = latest.status === 'revoked';
                return (
                  <div className={clsx(
                    "rounded-xl border p-5 space-y-4",
                    isRevoked
                      ? "bg-red-50/50 border-red-200"
                      : "bg-emerald-50/50 border-emerald-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isRevoked ? "bg-red-100" : "bg-emerald-100"
                        )}>
                          {isRevoked
                            ? <Ban size={16} className="text-red-600" />
                            : <CheckCircle size={16} className="text-emerald-600" />
                          }
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Графік на {latest.target_date}</h3>
                          <span className={clsx(
                            "text-xs font-semibold",
                            isRevoked ? "text-red-600" : "text-emerald-600"
                          )}>
                            {isRevoked ? 'Відкликано' : 'Активний'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReview(latest)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                        >
                          👁 Переглянути
                        </button>
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevoke(latest.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Відкликати
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2.5 bg-white/80 rounded-lg px-3.5 py-2.5 border border-gray-100">
                        <Clock size={14} className="text-blue-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Отримано системою</p>
                          <p className="text-sm font-bold text-gray-800">{fmtKyiv(latest.received_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white/80 rounded-lg px-3.5 py-2.5 border border-gray-100">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Опубліковано в PWA</p>
                          <p className="text-sm font-bold text-gray-800">{fmtKyiv(latest.published_at) || 'Очікує'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

      {/* Schedule Review Panel (overlay) */}
      {selectedReview && (
        <VerificationPanel
          result={selectedReview}
          onClose={() => setSelectedReview(null)}
          onRevoke={handleRevoke}
          GROUPS={GROUPS}
        />
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const StatCard = ({ label, value, icon, color, highlight, badge }: any) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className={clsx("admin-stat-card transition-all duration-200 hover:shadow-md",
      highlight && "border-amber-300 bg-amber-50/30"
    )}>
      <div className="flex items-center justify-between w-full">
        <div className="space-y-1 text-left">
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            {badge && (
              <span className={clsx(
                "px-2 py-0.5 text-[9px] font-bold rounded-md border flex items-center gap-1 shrink-0 select-none",
                highlight 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : label === "Поточний графік" || badge === "Підтверджено"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
              )}>
                <span className={clsx("w-1 h-1 rounded-full", 
                  highlight ? "bg-amber-500" : label === "Поточний графік" || badge === "Підтверджено" ? "bg-emerald-500" : "bg-gray-400"
                )} />
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={clsx("p-3.5 rounded-xl shrink-0 shadow-sm", colorMap[color])}>{icon}</div>
      </div>
    </div>
  );
};



/** Schedule review panel (slide-over) — read-only with revoke option */
const VerificationPanel = ({ result, onClose, onRevoke, GROUPS }: any) => {
  const gridData = result.raw_data || {};
  const fmtKyiv = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 h-full">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h4 className="text-lg font-bold text-gray-800">Перегляд графіка #{result.id}</h4>
            <p className="text-sm text-gray-500">Дата: {result.target_date} • Отримано: {fmtKyiv(result.received_at || result.created_at)}</p>
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

          {/* Grid (read-only) */}
          <div>
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Розпізнаний графік</h5>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
              <div className="min-w-[700px] space-y-1">
                {GROUPS.map((group: string) => (
                  <div key={group} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-semibold text-gray-500 font-mono text-right">{group}</span>
                    <div className="flex-1 flex gap-0.5">
                      {(gridData[group] || '1'.repeat(24)).split('').map((bit: string, i: number) => (
                        <div
                          key={i}
                          className={clsx(
                            "flex-1 h-6 rounded border",
                            bit === '1'
                              ? "bg-emerald-400 border-emerald-500"
                              : "bg-gray-200 border-gray-300"
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
            Закрити
          </button>
          {result.status !== 'revoked' && (
            <button onClick={() => onRevoke(result.id)} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
              🚫 Відкликати графік
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
