import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAddressRequests, updateAddressRequestStatus, logAdminAction } from '@/services/adminService';
import { 
  MapPin, CheckCircle, XCircle, Clock, AlertTriangle, Search
} from 'lucide-react';
import { clsx } from 'clsx';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

type FilterType = 'all' | 'pending' | 'resolved' | 'rejected';

export const AddressRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  
  // Modal state for approval/subgroup assignment
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [assignedSubgroup, setAssignedSubgroup] = useState('1.1');

  // Fetch requests from Supabase
  const { data: requests, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'addressRequests'],
    queryFn: fetchAddressRequests
  });

  // Mutation to update request status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, subgroup }: { id: number; status: 'resolved' | 'rejected'; subgroup?: string | null }) =>
      updateAddressRequestStatus(id, status, subgroup),
    onSuccess: async (_, variables) => {
      await logAdminAction(
        variables.status === 'resolved' ? 'APPROVE_ADDRESS_REQUEST' : 'REJECT_ADDRESS_REQUEST',
        variables.id.toString(),
        { subgroup: variables.subgroup, location: variables.status }
      );
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['admin', 'addressRequests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      
      setSelectedRequest(null);
    },
    onError: (err: any) => {
      alert(`Помилка: ${err.message}`);
    }
  });

  // Handle Approve submit
  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: 'resolved',
      subgroup: assignedSubgroup
    });
  };

  // Handle Reject click
  const handleReject = (id: number) => {
    if (!window.confirm('Ви впевнені, що хочете відхилити цей запит як недійсний?')) return;
    updateStatusMutation.mutate({
      id,
      status: 'rejected',
      subgroup: null
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!requests) return { total: 0, pending: 0, resolved: 0, rejected: 0 };
    return {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === 'pending').length,
      resolved: requests.filter((r: any) => r.status === 'resolved').length,
      rejected: requests.filter((r: any) => r.status === 'rejected').length
    };
  }, [requests]);

  // Filter & Search logic
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((req: any) => {
      // 1. Status Filter
      if (filter !== 'all' && req.status !== filter) return false;
      
      // 2. Search Text Match (Street, Village, Okrug, House)
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      const streetMatch = req.street?.toLowerCase().includes(searchLower);
      const villageMatch = req.village?.toLowerCase().includes(searchLower);
      const okrugMatch = req.okrug?.toLowerCase().includes(searchLower);
      const houseMatch = req.house?.toLowerCase().includes(searchLower);
      
      return streetMatch || villageMatch || okrugMatch || houseMatch;
    });
  }, [requests, filter, search]);

  // Format dates nicely
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('uk-UA', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Завантаження запитів адрес...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex flex-col items-center gap-4 text-center my-6">
        <AlertTriangle size={36} className="text-red-500" />
        <div>
          <h4 className="font-bold text-red-800 text-sm">Помилка завантаження даних</h4>
          <p className="text-red-600 text-xs mt-1">Не вдалося синхронізуватися з Supabase. Перевірте підключення.</p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="admin-btn-danger"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full text-left">
      {/* QUICK STATS CARDS */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-gray-500">Усього запитів</p>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats.total}</p>
            </div>
            <div className="p-3.5 bg-gray-50 text-gray-500 rounded-xl shrink-0 shadow-sm"><MapPin size={24} /></div>
          </div>
        </div>
        
        <div className="admin-stat-card border-amber-300 bg-amber-50/10">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-gray-500">Очікують опрацювання</p>
              <p className="text-3xl font-extrabold text-amber-700 tracking-tight">{stats.pending}</p>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 shadow-sm"><Clock size={24} /></div>
          </div>
        </div>

        <div className="admin-stat-card border-emerald-300 bg-emerald-50/10">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-gray-500">Схвалено (Додано)</p>
              <p className="text-3xl font-extrabold text-emerald-700 tracking-tight">{stats.resolved}</p>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 shadow-sm"><CheckCircle size={24} /></div>
          </div>
        </div>

        <div className="admin-stat-card border-red-300 bg-red-50/10">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-gray-500">Відхилено як спам</p>
              <p className="text-3xl font-extrabold text-red-700 tracking-tight">{stats.rejected}</p>
            </div>
            <div className="p-3.5 bg-red-50 text-red-650 rounded-xl shrink-0 shadow-sm"><XCircle size={24} /></div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="admin-system-board flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters stack */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 mr-2.5 hidden sm:inline flex-shrink-0 uppercase tracking-wider">Фільтри:</span>
          {(['all', 'pending', 'resolved', 'rejected'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all border cursor-pointer min-w-[110px] text-center shadow-sm duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                filter === f
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              {f === 'all' && `Всі запити (${stats.total})`}
              {f === 'pending' && `В очікуванні (${stats.pending})`}
              {f === 'resolved' && `Схвалені (${stats.resolved})`}
              {f === 'rejected' && `Відхилені (${stats.rejected})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук за назвою..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input !pl-9.5 !py-2"
          />
        </div>
      </div>

      {/* REQUESTS TABLE */}
      <div className="admin-table-container">
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-th">Локація / Тип</th>
                  <th className="admin-table-th">Адреса запиту</th>
                  <th className="admin-table-th">Дата запиту</th>
                  <th className="admin-table-th">Статус</th>
                  <th className="admin-table-th text-right pr-8">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {filteredRequests.map((req: any) => (
                  <tr key={req.id} className="admin-table-row">
                    <td className="admin-table-td">
                      <div className="flex flex-col gap-1 text-left">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold w-max uppercase tracking-wide border",
                          req.location_type === 'city' 
                            ? "bg-blue-50 text-blue-700 border-blue-100" 
                            : "bg-purple-50 text-purple-700 border-purple-100"
                        )}>
                          {req.location_type === 'city' ? 'Місто' : 'Село'}
                        </span>
                        {req.assigned_subgroup && (
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            Черга: <span className="font-bold text-emerald-600">{req.assigned_subgroup}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="admin-table-td">
                      <div className="flex flex-col gap-0.5 text-left">
                        {req.location_type === 'rural' && (
                          <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                            {req.okrug} округ • с. {req.village}
                          </span>
                        )}
                        <span className="font-extrabold text-gray-800 text-sm">
                          {req.street}, буд. {req.house}
                        </span>
                      </div>
                    </td>
                    <td className="admin-table-td text-gray-450 font-mono text-[11px] font-semibold">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="admin-table-td">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border",
                        req.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-100",
                        req.status === 'resolved' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                        req.status === 'rejected' && "bg-red-50 text-red-700 border-red-105"
                      )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full",
                          req.status === 'pending' && "bg-amber-500",
                          req.status === 'resolved' && "bg-emerald-500",
                          req.status === 'rejected' && "bg-red-500"
                        )} />
                        {req.status === 'pending' && 'Очікує'}
                        {req.status === 'resolved' && 'Схвалено'}
                        {req.status === 'rejected' && 'Відхилено'}
                      </span>
                    </td>
                    <td className="admin-table-td text-right pr-8">
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => { setSelectedRequest(req); setAssignedSubgroup('1.1'); }}
                            disabled={updateStatusMutation.isPending}
                            className="admin-btn-primary !px-3 !py-2"
                          >
                            <span>Схвалити</span>
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={updateStatusMutation.isPending}
                            className="admin-btn-danger !px-3 !py-2"
                          >
                            Відхилити
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-450 font-bold uppercase tracking-wider">Опрацьовано</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
            <div className="p-3 bg-gray-50 text-gray-300 rounded-full"><Search size={28} /></div>
            <p className="text-gray-400 font-bold text-sm">Не знайдено жодного запиту адрес</p>
            <p className="text-gray-400 text-xs max-w-xs leading-normal">
              Жоден запис не відповідає вашим фільтрам або пошуковому запиту.
            </p>
          </div>
        )}
      </div>

      {/* ASSIGN SUBGROUP MODAL (Overlay Dialog) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          
          {/* Modal Container */}
          <div className="relative bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-2xl p-6.5 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-5">
            <div>
              <h4 className="text-lg font-bold text-gray-800 leading-snug">Схвалення нової адреси</h4>
              <p className="text-xs text-gray-400 mt-1 leading-normal font-semibold">
                Присвойте номер черги погодинних відключень (ГПВ) для цієї адреси, щоб внести її в систему.
              </p>
            </div>

            {/* Address Details Card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 flex flex-col gap-1 text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Локація запиту</span>
              <span className="font-extrabold text-gray-700 text-sm">
                {selectedRequest.location_type === 'rural' 
                  ? `${selectedRequest.okrug} округ • с. {selectedRequest.village}`
                  : 'м. Старокостянтинів'
                }
              </span>
              <span className="text-xs text-gray-500 font-bold mt-1">
                {selectedRequest.street}, буд. {selectedRequest.house}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wide">Оберіть підчергу</label>
                <select
                  value={assignedSubgroup}
                  onChange={(e) => setAssignedSubgroup(e.target.value)}
                  className="admin-input font-bold"
                >
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>Черга {g}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  disabled={updateStatusMutation.isPending}
                  className="admin-btn-secondary flex-1"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="admin-btn-primary flex-[2]"
                >
                  {updateStatusMutation.isPending ? 'Схвалення...' : 'Підтвердити адресу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
