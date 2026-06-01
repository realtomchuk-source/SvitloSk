import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Terminal, Search, RefreshCw, Fingerprint } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

type LogLevel = 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
type LogTab = 'parser' | 'audit';

type ParserLog = {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  device_id: string | null;
};

type AdminAction = {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  details: any;
  created_at: string;
};

export function LogsViewer() {
  const [logTab, setLogTab] = useState<LogTab>('parser');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // --- Parser Logs ---
  const { data: logs, isLoading: logsLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'logs', levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('parser_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (levelFilter !== 'ALL') {
        query = query.eq('level', levelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ParserLog[];
    },
    enabled: logTab === 'parser',
  });

  // --- Audit Logs ---
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['admin', 'audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AdminAction[];
    },
    enabled: logTab === 'audit',
  });

  // Realtime for parser logs
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parser_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'logs', levelFilter] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [levelFilter, queryClient]);

  const filteredLogs = logs?.filter(log =>
    log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.source?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getLevelBadge = (level: string) => {
    const map: Record<string, string> = {
      'ERROR': 'text-red-600 bg-red-50',
      'WARNING': 'text-amber-600 bg-amber-50',
      'SUCCESS': 'text-emerald-600 bg-emerald-50',
      'INFO': 'text-blue-600 bg-blue-50',
    };
    return map[level] || 'text-gray-500 bg-gray-100';
  };

  const getActionBadge = (type: string) => {
    if (type.includes('DEL') || type.includes('block') || type.includes('delete')) return 'text-red-600 bg-red-50';
    if (type.includes('LIVE') || type.includes('unblock') || type.includes('APPROVE')) return 'text-emerald-600 bg-emerald-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'block_user': 'Блокування',
      'unblock_user': 'Розблокування',
      'update_user_profile': 'Зміна профілю',
      'publish_announcement': 'Публікація',
      'draft_announcement': 'Чернетка',
      'delete_announcement': 'Видалення',
      'update_announcement_status': 'Зміна статусу',
      'trigger_parser': 'Запуск парсера',
      'TRIGGER_PARSER': 'Запуск парсера',
      'APPROVE_RESULT': 'Підтвердження графіка',
      'UPDATE_USER_ROLE': 'Зміна ролі',
    };
    return labels[type] || type;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full text-left">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="admin-tab-group">
          <button
            onClick={() => setLogTab('parser')}
            className={clsx(
              "admin-tab-btn",
              logTab === 'parser' && "active"
            )}
          >
            <Terminal size={14} /> Логи парсера
          </button>
          <button
            onClick={() => setLogTab('audit')}
            className={clsx(
              "admin-tab-btn",
              logTab === 'audit' && "active"
            )}
          >
            <Fingerprint size={14} /> Аудит дій
          </button>
        </div>
        {logTab === 'parser' && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={clsx(
              "admin-btn-secondary !p-2",
              isFetching && "animate-spin"
            )}
            title="Оновити логи"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {/* === PARSER LOGS TAB === */}
      {logTab === 'parser' && (
        <>
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук у логах..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-input !pl-9.5"
              />
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as LogLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={clsx(
                    "px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all border cursor-pointer min-w-[95px] text-center shadow-sm duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                    levelFilter === level
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  )}
                >
                  {level === 'ALL' ? 'Всі' : level}
                </button>
              ))}
            </div>
          </div>

          {logsLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm font-semibold">Завантаження логів...</div>
          ) : (
            <>
              {/* Log entries */}
              <div className="admin-table-container font-mono text-sm max-h-[500px] overflow-y-auto !p-0">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-gray-400 py-12 text-sm font-semibold">
                    {searchQuery ? 'Логів не знайдено' : 'Немає логів'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 bg-white">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3.5 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 text-xs whitespace-nowrap pt-0.5 font-bold">
                          {new Date(log.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap border", getLevelBadge(log.level))}>
                          {log.level}
                        </span>
                        <span className="text-gray-400 text-xs font-semibold whitespace-nowrap">[{log.source || 'system'}]</span>
                        <span className="text-gray-700 flex-1 text-xs font-medium text-left">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <StatBox label="Всього логів" value={logs?.length || 0} color="gray" />
                <StatBox label="Помилок" value={logs?.filter(l => l.level === 'ERROR').length || 0} color="red" />
                <StatBox label="Попереджень" value={logs?.filter(l => l.level === 'WARNING').length || 0} color="amber" />
                <StatBox label="Успішних" value={logs?.filter(l => l.level === 'SUCCESS').length || 0} color="emerald" />
              </div>
            </>
          )}
        </>
      )}

      {/* === AUDIT LOGS TAB === */}
      {logTab === 'audit' && (
        <>
          {auditLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm font-semibold">Завантаження аудиту...</div>
          ) : (
            <div className="admin-table-container">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-table-th">Час</th>
                      <th className="admin-table-th">Операція</th>
                      <th className="admin-table-th">Ціль</th>
                      <th className="admin-table-th text-right pr-8">Деталі</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-xs font-medium text-gray-700 bg-white">
                    {auditLogs?.length === 0 ? (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-400 text-sm font-semibold">Журнал порожній</td></tr>
                    ) : (
                      auditLogs?.map((log) => (
                        <tr key={log.id} className="admin-table-row">
                          <td className="admin-table-td">
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-gray-750">{new Date(log.created_at).toLocaleDateString('uk-UA')}</span>
                              <span className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(log.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="admin-table-td">
                            <span className={clsx("px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider", getActionBadge(log.action_type))}>
                              {getActionLabel(log.action_type)}
                            </span>
                          </td>
                          <td className="admin-table-td">
                            <span className="text-xs font-mono text-gray-400 font-semibold truncate max-w-[150px] block text-left">{log.target_id || '—'}</span>
                          </td>
                          <td className="admin-table-td text-right pr-8 font-semibold">
                            {log.details && Object.entries(log.details).map(([key, val]) => (
                              <div key={key} className="text-xs text-gray-400 mt-0.5">
                                <span className="text-gray-500 font-bold">{key}:</span> {String(val)}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-800',
    red: 'text-red-600',
    amber: 'text-amber-650',
    emerald: 'text-emerald-700',
  };
  const bgMap: Record<string, string> = {
    gray: 'border-gray-200',
    red: 'border-red-200 bg-red-50/10',
    amber: 'border-amber-200 bg-amber-50/10',
    emerald: 'border-emerald-250 bg-emerald-50/10',
  };
  return (
    <div className={clsx("admin-stat-card !p-4", bgMap[color])}>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 text-left">{label}</p>
      <p className={clsx("text-2xl font-extrabold tracking-tight text-left", colorMap[color])}>{value}</p>
    </div>
  );
}
