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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setLogTab('parser')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              logTab === 'parser' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Terminal size={14} /> Логи парсера
          </button>
          <button
            onClick={() => setLogTab('audit')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              logTab === 'audit' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
              "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
              isFetching && "animate-spin"
            )}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* === PARSER LOGS TAB === */}
      {logTab === 'parser' && (
        <>
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук у логах..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as LogLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={clsx(
                    "px-2.5 py-2 rounded-lg text-[10px] font-semibold transition-all",
                    levelFilter === level
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {level === 'ALL' ? 'Всі' : level}
                </button>
              ))}
            </div>
          </div>

          {logsLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Завантаження логів...</div>
          ) : (
            <>
              {/* Log entries */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm font-mono text-sm max-h-[500px] overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-gray-400 py-10 text-sm">
                    {searchQuery ? 'Логів не знайдено' : 'Немає логів'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 text-xs whitespace-nowrap pt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap", getLevelBadge(log.level))}>
                          {log.level}
                        </span>
                        <span className="text-gray-400 text-xs whitespace-nowrap">[{log.source || 'system'}]</span>
                        <span className="text-gray-700 flex-1 text-xs">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <StatBox label="Всього" value={logs?.length || 0} color="gray" />
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
            <div className="py-12 text-center text-gray-400 text-sm">Завантаження аудиту...</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">Час</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">Операція</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">Ціль</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Деталі</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs?.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">Журнал порожній</td></tr>
                    ) : (
                      auditLogs?.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700">{new Date(log.created_at).toLocaleDateString('uk-UA')}</p>
                            <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold", getActionBadge(log.action_type))}>
                              {getActionLabel(log.action_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-gray-500 truncate max-w-[150px] block">{log.target_id || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.details && Object.entries(log.details).map(([key, val]) => (
                              <div key={key} className="text-xs text-gray-400">
                                <span className="text-gray-500">{key}:</span> {String(val)}
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
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  };
  return (
    <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
      <p className="text-[10px] text-gray-500 font-medium mb-0.5">{label}</p>
      <p className={clsx("text-xl font-bold", colorMap[color])}>{value}</p>
    </div>
  );
}
