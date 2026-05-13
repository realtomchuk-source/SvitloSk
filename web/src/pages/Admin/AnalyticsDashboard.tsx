import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Activity, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

type DailyStat = {
  date: string;
  processed_records: number;
  errors: number;
  avg_latency_ms: number;
};


export function AnalyticsDashboard() {
  const { data: dailyStats, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics', 'daily'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);
      
      if (error) throw error;
      return data as DailyStat[];
    },
  });

  const { data: parserLogs } = useQuery({
    queryKey: ['admin', 'analytics', 'recent-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parser_logs')
        .select('*')
        .eq('level', 'ERROR')
        .order('timestamp', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Transform data for charts
  const chartData = dailyStats?.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
    latency: stat.avg_latency_ms,
    errors: stat.errors,
    processed: stat.processed_records
  })).reverse() || [];

  // Calculate totals
  const totalProcessed = dailyStats?.reduce((sum, stat) => sum + stat.processed_records, 0) || 0;
  const totalErrors = dailyStats?.reduce((sum, stat) => sum + stat.errors, 0) || 0;
  const avgLatency = dailyStats?.length 
    ? (dailyStats.reduce((sum, stat) => sum + stat.avg_latency_ms, 0) / dailyStats.length).toFixed(2)
    : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Завантаження аналітики...</div>
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
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-600/20 rounded-2xl">
          <Activity size={24} className="text-purple-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Аналітика та звіти</h2>
          <p className="text-sm text-zinc-500">Статистика за останні 7 днів</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<TrendingUp className="text-green-500" />}
          label="Оброблено записів"
          value={totalProcessed.toLocaleString()}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          icon={<AlertCircle className="text-red-500" />}
          label="Помилок"
          value={totalErrors.toString()}
          trend="-5%"
          trendUp={false}
        />
        <StatCard
          icon={<Clock className="text-blue-500" />}
          label="Середня затримка"
          value={`${avgLatency} мс`}
          trend="-8%"
          trendUp={false}
        />
      </div>

      {/* Daily Stats Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Динаміка затримки (мс)
            </h3>
          </div>
          <div className="p-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}мс`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" /> Кількість помилок
            </h3>
          </div>
          <div className="p-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#ef4444' }}
                />
                <Bar dataKey="errors" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.errors > 0 ? '#ef4444' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {parserLogs && parserLogs.length > 0 && (
        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            Останні помилки парсера
          </h3>
          <div className="space-y-3">
            {parserLogs.map((log: any) => (
              <div key={log.id} className="p-4 bg-zinc-800/50 rounded-2xl border border-red-600/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">{log.message}</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {new Date(log.timestamp).toLocaleString('uk-UA')}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-[10px] font-bold uppercase">
                    {log.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  trendUp 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: string; 
  trendUp?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2.5rem]">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-zinc-800 rounded-2xl">
          {icon}
        </div>
        {trend && (
          <span className={clsx(
            "text-xs font-bold px-2 py-1 rounded-full",
            trendUp ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
