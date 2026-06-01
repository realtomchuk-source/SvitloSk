import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Users, Search, X, ShieldAlert, Shield, User, MoreVertical } from 'lucide-react';
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
  push_slots?: any[];
};

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      // 1. Fetch user profiles
      const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (pError) throw pError;

      // 2. Fetch all notification slots (the 2 push subgroups)
      const { data: slots, error: sError } = await supabase
        .from('notification_slots')
        .select('user_id, data');

      if (sError) {
        console.error('Failed to fetch notification slots:', sError);
        return profiles.map(p => ({ ...p, push_slots: [] })) as UserProfile[];
      }

      // 3. Map slots to user profiles
      return profiles.map(p => {
        const userSlots = slots?.filter(s => s.user_id === p.id) || [];
        return {
          ...p,
          push_slots: userSlots.map(us => us.data)
        };
      }) as UserProfile[];
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
      <p className="text-xs">{(error as any)?.message || 'Не вдалося завантажити дані'}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full text-left">
      {/* Search + Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Пошук користувачів (email, ім'я)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input !pl-11"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 shrink-0 w-fit shadow-sm">
          <Users size={14} /> {filteredUsers?.length || 0} користувачів
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-table-th">Користувач</th>
                <th className="admin-table-th">Черги ГПВ</th>
                <th className="admin-table-th text-right pr-8">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredUsers?.map(user => (
                <tr key={user.id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div className="flex flex-col text-left">
                      {user.full_name ? (
                        <>
                          <p className="text-sm font-bold text-gray-800 leading-snug">{user.full_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-gray-800 leading-snug">{user.email || 'Без email'}</p>
                      )}
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex flex-wrap items-center gap-1.5 text-left">
                      {/* Start/Default Subgroup */}
                      <span 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-extrabold shadow-sm"
                        title="Стартова підчерга"
                      >
                        🏠 {user.start_group || '—'}
                      </span>
                      
                      {/* Active Push Subgroups */}
                      {user.push_slots && user.push_slots
                        .filter((s: any) => s.isActive && s.subGroup)
                        .map((slot: any) => (
                          <span 
                            key={slot.id} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-extrabold shadow-sm"
                            title={`Пуш-підчерга: ${slot.name || `Черга ${slot.subGroup}`}`}
                          >
                            🔔 {slot.subGroup}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="admin-table-td text-right pr-8">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-gray-450 hover:text-gray-655 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
            <p className="text-sm text-gray-400 font-bold">Користувачів не знайдено</p>
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)} />
          <div className="admin-modal-container">
            {/* Header */}
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Дія з користувачем</h3>
                <p className="admin-modal-subtitle">{selectedUser.full_name ? 'Перегляд та зміна ролі' : 'Адміністрування користувача'}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="admin-modal-close">
                <X size={18} />
              </button>
            </div>
            
            {/* User Profile Card */}
            <div className="admin-modal-usercard">
              <div className="admin-modal-usercard-icon">
                <User size={20} />
              </div>
              <div className="admin-modal-usercard-info">
                <p className="admin-modal-usercard-name">
                  {selectedUser.full_name || 'Користувач без імені'}
                </p>
                <p className="admin-modal-usercard-email">{selectedUser.email || 'Немає email'}</p>
              </div>
            </div>

            {/* Secondary Metadata Info (Moved from columns to Three-Dots Action menu) */}
            <div className="admin-modal-meta">
              <div className="admin-modal-meta-row">
                <span className="admin-modal-meta-label">Статус / Роль</span>
                <span className="admin-modal-meta-value">
                  <span className={clsx(
                    "px-2 py-0.5 rounded font-extrabold uppercase text-[9px] border",
                    selectedUser.role === 'admin' && "bg-amber-50 text-amber-700 border-amber-250",
                    selectedUser.role === 'blocked' && "bg-rose-50 text-rose-700 border-rose-250",
                    (selectedUser.role === 'user' || !selectedUser.role) && "bg-blue-50 text-blue-700 border-blue-250"
                  )}>
                    {selectedUser.role === 'admin' ? 'Адмін' : selectedUser.role === 'blocked' ? 'Заблокований' : 'Користувач'}
                  </span>
                </span>
              </div>
              
              <div className="admin-modal-meta-row">
                <span className="admin-modal-meta-label">Дата реєстрації</span>
                <span className="admin-modal-meta-value">{new Date(selectedUser.created_at).toLocaleDateString('uk-UA')}</span>
              </div>

              <div className="admin-modal-meta-row">
                <span className="admin-modal-meta-label">Останній вхід</span>
                <span className="admin-modal-meta-value">
                  {selectedUser.last_sign_in 
                    ? new Date(selectedUser.last_sign_in).toLocaleDateString('uk-UA') + ' ' + new Date(selectedUser.last_sign_in).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
                    : 'Новий користувач'
                  }
                </span>
              </div>
            </div>

            {/* Role Changing Grid */}
            <div className="admin-modal-grid">
              {/* User Button */}
              <button 
                onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: 'user' })}
                className={clsx(
                  "admin-modal-grid-btn",
                  (selectedUser.role === 'user' || !selectedUser.role) && "active-user"
                )}
              >
                <User size={20} />
                <span>Користувач</span>
              </button>

              {/* Admin Button */}
              <button 
                onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: 'admin' })}
                className={clsx(
                  "admin-modal-grid-btn",
                  selectedUser.role === 'admin' && "active-admin"
                )}
              >
                <Shield size={20} />
                <span>Адмін</span>
              </button>

              {/* Blocked Button */}
              <button 
                onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: 'blocked' })}
                className={clsx(
                  "admin-modal-grid-btn",
                  selectedUser.role === 'blocked' && "active-blocked"
                )}
              >
                <ShieldAlert size={20} />
                <span>Блокувати</span>
              </button>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="admin-btn-secondary w-full py-2.5 cursor-pointer hover:scale-[1.01] transition-all"
            >
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
