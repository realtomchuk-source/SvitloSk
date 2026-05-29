import { useQuery } from '@tanstack/react-query';
import { fetchSystemStats } from '@/services/adminService';
import { Activity, Users, BarChart2, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export function AnalyticsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchSystemStats,
    refetchInterval: 60000 
  });

  const densityData = stats ? Object.entries(stats.groupDensity)
    .filter(([name]) => name !== 'none')
    .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
    .map(([name, count]) => ({ name: `${name}`, count })) : [];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Завантаження аналітики...</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          icon={<Users size={20} />} 
          label="Користувачів" 
          value={stats?.totalUsers.toLocaleString() || '0'} 
          subtext="Активних підписників"
          color="blue"
        />
        <MetricCard 
          icon={<Activity size={20} />} 
          label="Подій за 24г" 
          value={stats?.recentActions.toString() || '0'} 
          subtext="Адмін-операцій"
          color="purple"
        />
        <MetricCard 
          icon={<TrendingUp size={20} />} 
          label="Синхронізація" 
          value="100%" 
          subtext="Вузлів синхронізовано"
          color="emerald"
        />
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-600" /> Розподіл по підчергах
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Кількість користувачів в кожній групі</p>
          </div>
          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-semibold">Оновлюється</span>
        </div>
        
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={densityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
                fontWeight={600}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  padding: '8px 12px', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ color: '#2563eb' }}
                labelFormatter={(label) => `Підчерга ${label}`}
                formatter={(value: any) => [`${value} користувачів`, '']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                {densityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, color }: any) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mb-0.5">{value}</p>
          <p className="text-[10px] text-gray-400">{subtext}</p>
        </div>
        <div className={clsx("p-2 rounded-lg", colorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
