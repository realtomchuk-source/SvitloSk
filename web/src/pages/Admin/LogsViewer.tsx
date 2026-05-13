import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Terminal, Filter, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

type LogLevel = 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

type ParserLog = {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  device_id: string | null;
};

export function LogsViewer() {
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: logs, isLoading, error, refetch, isFetching } = useQuery({
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
  });

  // Setup Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parser_logs',
        },
        (payload) => {
          // Refetch logs when a new one is inserted
          queryClient.invalidateQueries({ queryKey: ['admin', 'logs', levelFilter] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [levelFilter, queryClient]);

  const filteredLogs = logs?.filter(log =>
    log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.source?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400 bg-red-600/20';
      case 'WARNING':
        return 'text-amber-400 bg-amber-600/20';
      case 'SUCCESS':
        return 'text-green-400 bg-green-600/20';
      case 'INFO':
        return 'text-blue-400 bg-blue-600/20';
      default:
        return 'text-zinc-400 bg-zinc-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Завантаження логів...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Помилка: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600/20 rounded-2xl">
            <Terminal size={24} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Логи парсера</h2>
            <p className="text-sm text-zinc-500">Останні 100 записів</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={clsx(
            "p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all",
            isFetching && "animate-spin"
          )}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Пошук у логах..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as LogLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={clsx(
                "px-4 py-3 rounded-2xl text-xs font-bold uppercase transition-all",
                levelFilter === level
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 text-zinc-500 hover:text-white border border-white/5"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-black border border-white/5 rounded-[2.5rem] p-6 font-mono text-sm max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-zinc-600 italic py-10">
            {searchQuery ? 'Логів не знайдено' : 'Немає логів для відображення'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-900/50 transition-colors"
              >
                <span className="text-zinc-600 text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('uk-UA')}
                </span>
                <span className={clsx(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap",
                  getLevelColor(log.level)
                )}>
                  {log.level}
                </span>
                <span className="text-zinc-500 text-xs whitespace-nowrap">
                  [{log.source || 'system'}]
                </span>
                <span className="text-zinc-300 flex-1">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Всього</p>
          <p className="text-2xl font-black text-white">{logs?.length || 0}</p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Помилок</p>
          <p className="text-2xl font-black text-red-400">
            {logs?.filter(l => l.level === 'ERROR').length || 0}
          </p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Попереджень</p>
          <p className="text-2xl font-black text-amber-400">
            {logs?.filter(l => l.level === 'WARNING').length || 0}
          </p>
        </div>
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Успішних</p>
          <p className="text-2xl font-black text-green-400">
            {logs?.filter(l => l.level === 'SUCCESS').length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
