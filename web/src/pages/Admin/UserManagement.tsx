import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Users, Search, X, ShieldAlert, User, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { logAdminAction } from '@/services/adminService';

type UserProfile = {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
  created_at: string;
  last_sign_in?: string;
  start_group?: string;
};

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      await logAdminAction('UPDATE_USER_ROLE', userId, { new_role: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUser(null);
      alert('Роль оновлено.');
    }
  });

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Завантаження користувачів...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={16} />
        <p className="font-semibold text-sm">Помилка завантаження</p>
      </div>
      <p className="text-xs text-red-500">{(error as any).message}</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Search + Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Пошук (email, ім'я, ID)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
          <Users size={14} /> {filteredUsers?.length || 0} користувачів
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-200">
                <th className="px-4 py-3">Користувач</th>
                <th className="px-4 py-3">Підчерга</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Реєстрація</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers?.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.full_name || 'Без імені'}</p>
                        <p className="text-xs text-gray-400 font-mono">{user.email || user.id.slice(0, 12) + '...'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{user.start_group || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold",
                      user.role === 'admin' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      <div className={clsx("w-1.5 h-1.5 rounded-full", user.role === 'admin' ? "bg-red-500" : "bg-blue-500")} />
                      {user.role === 'admin' ? 'Адмін' : 'Користувач'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('uk-UA')}</p>
                    <p className="text-xs text-gray-400">{user.last_sign_in ? `Останній: ${new Date(user.last_sign_in).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}` : 'Новий'}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers?.length === 0 && (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">Користувачів не знайдено</p>
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Зміна ролі</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedUser.email || selectedUser.id}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedUser.full_name || 'Без імені'}</p>
                <p className="text-xs text-gray-400">Поточна роль: {selectedUser.role === 'admin' ? 'Адмін' : 'Користувач'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button 
                onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: 'user' })}
                className={clsx(
                  "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all text-sm",
                  selectedUser.role === 'user' ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <User size={24} />
                <span className="text-xs font-semibold">Користувач</span>
              </button>
              <button 
                onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: 'admin' })}
                className={clsx(
                  "p-4 rounded-lg border flex flex-col items-center gap-2 transition-all text-sm",
                  selectedUser.role === 'admin' ? "bg-red-50 border-red-300 text-red-700 font-semibold" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <ShieldAlert size={24} />
                <span className="text-xs font-semibold">Адмін</span>
              </button>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 bg-gray-100 text-gray-600 font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
