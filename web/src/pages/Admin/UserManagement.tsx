import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Users, Search, Ban, CheckCircle, Edit3, X, Save } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
  start_group: string;
  tomorrow_push: boolean;
};

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, role, status, last_login, created_at, start_group, tomorrow_push')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      return { id, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: { id: string; start_group: string; tomorrow_push: boolean; role: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          start_group: updates.start_group, 
          tomorrow_push: updates.tomorrow_push,
          role: updates.role,
          last_active: new Date().toISOString() 
        })
        .eq('id', updates.id);
      
      if (error) throw error;
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUser(null);
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Завантаження користувачів...</div>
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
          <div className="p-3 bg-blue-600/20 rounded-2xl">
            <Users size={24} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Управління користувачами</h2>
            <p className="text-sm text-zinc-500">Всього користувачів: {users?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Пошук за email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">Всі ролі</option>
            <option value="admin">Адміни</option>
            <option value="user">Користувачі</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          >
            <option value="ALL">Всі статуси</option>
            <option value="active">Активні</option>
            <option value="blocked">Заблоковані</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-800/30 border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Користувач / Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Права</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Статус</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Активність</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Керування</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length === 0 ? (

              <tr>
                <td colSpan={5} className="p-10 text-center text-zinc-600 italic">
                  {searchQuery ? 'Користувачів не знайдено' : 'Немає користувачів'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold tracking-tight">{user.email || 'Анонімний користувач'}</span>
                      <span className="text-[10px] text-zinc-600 font-mono mt-0.5">{user.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                      user.role === 'admin' ? "bg-purple-600/20 text-purple-400 border border-purple-500/20" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit",
                      user.status === 'active' ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                    )}>
                      {user.status === 'active' ? <CheckCircle size={10} /> : <Ban size={10} />}
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-zinc-400 font-medium">{user.last_login ? new Date(user.last_login).toLocaleDateString('uk-UA') : '—'}</span>
                      <span className="text-[10px] text-zinc-600">{user.last_login ? new Date(user.last_login).toLocaleTimeString('uk-UA') : ''}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: user.id, currentStatus: user.status })}
                        disabled={toggleStatusMutation.isPending}
                        className={clsx(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                          user.status === 'active'
                            ? "bg-red-600/10 text-red-400 hover:bg-red-600/20"
                            : "bg-green-600/10 text-green-400 hover:bg-green-600/20",
                          toggleStatusMutation.isPending && "opacity-50"
                        )}
                      >
                        {user.status === 'active' ? 'Блок' : 'Дозволити'}
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))

            )}
          </tbody>
        </table>
      </div>
    </div>


      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">Налаштування користувача</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Email користувача</p>
                <p className="text-zinc-300 font-medium">{selectedUser.email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Роль користувача</label>
                  <select 
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="user">Користувач (user)</option>
                    <option value="admin">Адміністратор (admin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Початкова група</label>
                  <select 
                    value={selectedUser.start_group}
                    onChange={(e) => setSelectedUser({ ...selectedUser, start_group: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Пуш на завтра</p>
                    <p className="text-xs text-zinc-500">Нагадування про графік наступного дня</p>
                  </div>
                  <button 
                    onClick={() => setSelectedUser({ ...selectedUser, tomorrow_push: !selectedUser.tomorrow_push })}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-all relative",
                      selectedUser.tomorrow_push ? "bg-blue-600" : "bg-zinc-700"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      selectedUser.tomorrow_push ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-800/30 border-t border-white/5 flex gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Скасувати
              </button>
              <button 
                onClick={() => updateUserMutation.mutate({ 
                  id: selectedUser.id, 
                  start_group: selectedUser.start_group, 
                  tomorrow_push: selectedUser.tomorrow_push,
                  role: selectedUser.role
                })}
                disabled={updateUserMutation.isPending}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {updateUserMutation.isPending ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
