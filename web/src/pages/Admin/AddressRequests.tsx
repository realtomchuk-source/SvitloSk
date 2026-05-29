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
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Усього запитів</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            <div className="p-2 bg-gray-50 text-gray-500 rounded-lg"><MapPin size={20} /></div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm border-amber-200 bg-amber-50/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Очікують опрацювання</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-700">{stats.pending}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm border-emerald-200 bg-emerald-50/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Схвалено (Додано)</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-700">{stats.resolved}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20} /></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm border-red-200 bg-red-50/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Відхилено як спам</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-red-700">{stats.rejected}</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><XCircle size={20} /></div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters stack */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400 mr-2 hidden sm:inline flex-shrink-0">Фільтри:</span>
          {(['all', 'pending', 'resolved', 'rejected'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all border",
                filter === f
                  ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
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
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Пошук за назвою..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50/50 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* REQUESTS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Локація / Тип</th>
                  <th className="px-6 py-4">Адреса запиту</th>
                  <th className="px-6 py-4">Дата запиту</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                {filteredRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-1">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold w-max uppercase tracking-wide",
                          req.location_type === 'city' 
                            ? "bg-blue-50 text-blue-700 border border-blue-100" 
                            : "bg-purple-50 text-purple-700 border border-purple-100"
                        )}>
                          {req.location_type === 'city' ? 'Місто' : 'Село'}
                        </span>
                        {req.assigned_subgroup && (
                          <span className="text-[10px] text-gray-400">
                            Призначено: <span className="font-bold text-emerald-600">{req.assigned_subgroup}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-0.5">
                        {req.location_type === 'rural' && (
                          <span className="text-[10px] text-gray-400">
                            {req.okrug} старостинський округ • с. {req.village}
                          </span>
                        )}
                        <span className="font-bold text-gray-800 text-sm">
                          {req.street}, буд. {req.house}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-gray-400 font-mono text-[11px]">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                        req.status === 'pending' && "bg-amber-50 text-amber-700 border border-amber-100",
                        req.status === 'resolved' && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                        req.status === 'rejected' && "bg-red-50 text-red-700 border border-red-100"
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
                    <td className="px-6 py-4.5 text-right">
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => { setSelectedRequest(req); setAssignedSubgroup('1.1'); }}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Схвалити</span>
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1.5 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 font-semibold text-[11px] rounded-lg transition-colors"
                          >
                            Відхилити
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">Опрацьовано</span>
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
            <p className="text-gray-400 font-semibold text-sm">Не знайдено жодного запиту адрес</p>
            <p className="text-gray-400 text-xs max-w-xs leading-normal">
              Жоден запис не відповідає вашим фільтрам або пошуковому запиту.
            </p>
          </div>
        )}
      </div>

      {/* ASSIGN SUBGROUP MODAL (Overlay Dialog) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          
          {/* Modal Container */}
          <div className="relative bg-white border border-gray-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Схвалення нової адреси</h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-normal">
                Присвойте номер черги погодинних відключень (ГПВ) для цієї адреси, щоб внести її в систему.
              </p>
            </div>

            {/* Address Details Card */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Локація запиту</span>
              <span className="font-bold text-gray-700 text-sm">
                {selectedRequest.location_type === 'rural' 
                  ? `${selectedRequest.okrug} округ • с. ${selectedRequest.village}`
                  : 'м. Старокостянтинів'
                }
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">
                {selectedRequest.street}, буд. {selectedRequest.house}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Оберіть підчергу</label>
                <select
                  value={assignedSubgroup}
                  onChange={(e) => setAssignedSubgroup(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-colors"
                >
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>Черга {g}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
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
