import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Megaphone, Trash2, Send, Plus, Clock, Edit2, ArrowUp, ArrowDown, X, GripVertical } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { logAdminAction } from '@/services/adminService';

type Announcement = {
  id: string;
  title: string;
  text: string;
  status: 'draft' | 'published' | 'archived';
  is_active: boolean;
  created_at: string;
  created_by: string;
  active_date: string | null;
  time_label: string | null;
  sort_order: number;
};

type FormData = {
  title: string;
  text: string;
  time_label: string;
  active_date: string;
};

const toKyivISODate = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const dateMap: Record<string, string> = {};
  parts.forEach(p => { dateMap[p.type] = p.value; });
  return `${dateMap.year}-${dateMap.month}-${dateMap.day}`;
};

const emptyForm = (date: string): FormData => ({
  title: '',
  text: '',
  time_label: '',
  active_date: date,
});

/** YYYY-MM-DD for today in Kyiv timezone */
const todayISO = () => toKyivISODate(new Date());

/** YYYY-MM-DD for tomorrow in Kyiv timezone */
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toKyivISODate(d);
};

/** DD.MM format */
const shortDate = (iso: string) => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}`;
};

export function Announcements() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [form, setForm] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useStore();
  const queryClient = useQueryClient();

  const today = todayISO();
  const tomorrow = tomorrowISO();
  const currentDate = activeTab === 'today' ? today : tomorrow;

  // --- Fetch feed mode settings ---
  const { data: feedSettings } = useQuery({
    queryKey: ['admin', 'feedSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_feed_settings')
        .select('*');
      if (error) throw error;
      return data as { active_date: string; mode: 'append' | 'override' }[];
    }
  });

  const currentFeedMode = useMemo(() => {
    const setting = feedSettings?.find(s => s.active_date === currentDate);
    return setting?.mode || 'append'; // default is append
  }, [feedSettings, currentDate]);

  const setFeedModeMutation = useMutation({
    mutationFn: async (mode: 'append' | 'override') => {
      const { error } = await supabase
        .from('news_feed_settings')
        .upsert({
          active_date: currentDate,
          mode,
          updated_at: new Date().toISOString()
        }, { onConflict: 'active_date' });
      if (error) throw error;
      // Do not await to prevent any auth lock/storage deadlocks from blocking the UI
      logAdminAction('change_feed_mode', currentDate, { mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feedSettings'] });
    },
    onError: (err: any) => {
      console.error('Failed to change feed mode:', err);
      alert(`Не вдалося змінити режим стрічки: ${err.message || JSON.stringify(err)}`);
    }
  });

  // --- Fetch all announcements ---
  const { data: allAnnouncements, isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Filter by date
  const announcements = useMemo(() =>
    allAnnouncements?.filter(a => a.active_date === currentDate) || [],
    [allAnnouncements, currentDate]
  );

  const todayCount = useMemo(() =>
    allAnnouncements?.filter(a => a.active_date === today).length || 0,
    [allAnnouncements, today]
  );

  const tomorrowCount = useMemo(() =>
    allAnnouncements?.filter(a => a.active_date === tomorrow).length || 0,
    [allAnnouncements, tomorrow]
  );

  // --- Mutations ---
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { status: string }) => {
      const maxSort = announcements.reduce((max, a) => Math.max(max, a.sort_order || 0), 0);
      const isPublished = data.status === 'published';
      const { data: created, error } = await supabase
        .from('system_announcements')
        .insert([{
          title: data.title,
          text: data.text,
          time_label: data.time_label || null,
          active_date: data.active_date,
          status: data.status,
          is_active: isPublished,
          created_by: user?.id,
          sort_order: maxSort + 1,
        }])
        .select().single();
      if (error) throw error;
      // Do not await to prevent any auth lock/storage deadlocks from blocking the UI
      logAdminAction(isPublished ? 'publish_announcement' : 'draft_announcement', String(created.id), { title: data.title });
    },
    onSuccess: () => { invalidate(); setForm(null); setEditingId(null); },
    onError: (err: any) => {
      console.error('Create announcement error:', err);
      alert(`Не вдалося створити оголошення: ${err.message || JSON.stringify(err)}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: FormData & { id: string; status: string }) => {
      const isPublished = data.status === 'published';
      const targetId = typeof id === 'string' ? parseInt(id, 10) : id;
      const { error } = await supabase
        .from('system_announcements')
        .update({
          title: data.title,
          text: data.text,
          time_label: data.time_label || null,
          active_date: data.active_date,
          status: data.status,
          is_active: isPublished,
        })
        .eq('id', targetId);
      if (error) throw error;
      // Do not await to prevent any auth lock/storage deadlocks from blocking the UI
      logAdminAction('update_announcement_status', String(id), { title: data.title, status: data.status });
    },
    onSuccess: () => { invalidate(); setForm(null); setEditingId(null); },
    onError: (err: any) => {
      console.error('Update announcement error:', err);
      alert(`Не вдалося оновити оголошення: ${err.message || JSON.stringify(err)}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const targetId = typeof id === 'string' ? parseInt(id, 10) : id;
      const { error } = await supabase.from('system_announcements').delete().eq('id', targetId);
      if (error) throw error;
      // Do not await to prevent any auth lock/storage deadlocks from blocking the UI
      logAdminAction('delete_announcement', String(id));
    },
    onSuccess: invalidate,
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const targetId = typeof id === 'string' ? parseInt(id, 10) : id;
      const { error } = await supabase
        .from('system_announcements')
        .update({ status: 'published', is_active: true })
        .eq('id', targetId);
      if (error) throw error;
      // Do not await to prevent any auth lock/storage deadlocks from blocking the UI
      logAdminAction('publish_announcement', String(id));
    },
    onSuccess: invalidate,
  });

  const swapOrderMutation = useMutation({
    mutationFn: async ({ a, b }: { a: Announcement; b: Announcement }) => {
      await supabase.from('system_announcements').update({ sort_order: b.sort_order }).eq('id', a.id);
      await supabase.from('system_announcements').update({ sort_order: a.sort_order }).eq('id', b.id);
    },
    onSuccess: invalidate,
  });

  // --- Handlers ---
  const handleEdit = (item: Announcement) => {
    setForm({
      title: item.title || '',
      text: item.text || '',
      time_label: item.time_label || '',
      active_date: item.active_date || currentDate,
    });
    setEditingId(item.id);
  };

  const handleSave = (status: string) => {
    if (!form || !form.text.trim()) return;
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId, status });
    } else {
      createMutation.mutate({ ...form, status });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    swapOrderMutation.mutate({ a: announcements[index], b: announcements[index - 1] });
  };

  const handleMoveDown = (index: number) => {
    if (index >= announcements.length - 1) return;
    swapOrderMutation.mutate({ a: announcements[index], b: announcements[index + 1] });
  };

  const charCount = form?.text.length || 0;
  const charMax = 2000;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Завантаження оголошень...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full text-left">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="admin-tab-group">
          <button
            onClick={() => { setActiveTab('today'); setForm(null); setEditingId(null); }}
            className={clsx(
              "admin-tab-btn",
              activeTab === 'today' && "active"
            )}
          >
            <Megaphone size={14} /> Сьогодні ({shortDate(today)})
            {todayCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{todayCount}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('tomorrow'); setForm(null); setEditingId(null); }}
            className={clsx(
              "admin-tab-btn",
              activeTab === 'tomorrow' && "active"
            )}
          >
            <Clock size={14} /> Завтра ({shortDate(tomorrow)})
            {tomorrowCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{tomorrowCount}</span>}
          </button>
        </div>
      </div>

      {/* Налаштування джерела стрічки новин */}
      <div className="admin-system-board bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-gray-850">Режим стрічки новин</h4>
          <p className="text-xs text-gray-400">Оберіть варіант відображення стрічки на {activeTab === 'today' ? 'сьогодні' : 'завтра'}.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => setFeedModeMutation.mutate('append')}
            disabled={setFeedModeMutation.isPending}
            className={clsx(
              "px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2",
              currentFeedMode === 'append'
                ? "bg-[#EE7221]/10 text-[#EE7221] border-[#EE7221]"
                : "bg-gray-50 text-[#374151] border-gray-200 hover:bg-gray-100"
            )}
          >
            <span>🔗 Автоматична + мої новини</span>
          </button>
          <button
            onClick={() => setFeedModeMutation.mutate('override')}
            disabled={setFeedModeMutation.isPending}
            className={clsx(
              "px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2",
              currentFeedMode === 'override'
                ? "bg-[#EE7221]/10 text-[#EE7221] border-[#EE7221]"
                : "bg-gray-50 text-[#374151] border-gray-200 hover:bg-gray-100"
            )}
          >
            <span>🚫 Тільки мої новини</span>
          </button>
        </div>
      </div>

      {/* Form (create/edit) */}
      {form && (
        <div className="admin-system-board border-blue-200 bg-blue-50/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">
              {editingId ? 'Редагування оголошення' : 'Нове оголошення'}
            </h4>
            <button onClick={() => { setForm(null); setEditingId(null); }} className="p-1.5 text-gray-400 hover:text-gray-650 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">Час дії</label>
              <input
                type="text"
                value={form.time_label}
                onChange={(e) => setForm({ ...form, time_label: e.target.value })}
                placeholder="Наприклад: 12:00-16:00"
                className="admin-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">Заголовок (необов'язково)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Заголовок картки"
                className="admin-input"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">Текст оголошення</label>
            <div className="relative">
              <textarea
                value={form.text}
                onChange={(e) => {
                  if (e.target.value.length <= charMax) {
                    setForm({ ...form, text: e.target.value });
                  }
                }}
                placeholder="Введіть перелік вулиць, черг або деталей відключення..."
                rows={3}
                className="admin-textarea"
              />
              <span className={clsx(
                "absolute bottom-2.5 right-3.5 text-[10px] font-mono font-semibold",
                charCount > charMax * 0.9 ? "text-red-500" : "text-gray-300"
              )}>
                {charCount}/{charMax}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => handleSave('draft')}
              disabled={!form.text.trim()}
              className="admin-btn-secondary"
            >
              Зберегти чернетку
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={!form.text.trim()}
              className="admin-btn-primary"
            >
              <Send size={12} /> Опублікувати
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="flex flex-col gap-3">
        {announcements.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center shadow-sm">
            <Megaphone size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-400">Немає оголошень на {shortDate(currentDate)}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-normal">Ви можете додати нове оголошення або чернетку для цієї дати за допомогою кнопки нижче.</p>
          </div>
        ) : (
          announcements.map((item, index) => (
            <div
              key={item.id}
              className={clsx(
                "admin-list-item w-full flex items-start gap-4",
                item.status === 'published' && "border-blue-200 bg-blue-50/10"
              )}
            >
              {/* Sort handle */}
              <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
                <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-0.5 text-gray-300 hover:text-gray-650 disabled:opacity-20 transition-colors" title="Перемістити вгору"><ArrowUp size={14} /></button>
                <GripVertical size={14} className="text-gray-300" />
                <button onClick={() => handleMoveDown(index)} disabled={index === announcements.length - 1} className="p-0.5 text-gray-300 hover:text-gray-650 disabled:opacity-20 transition-colors" title="Перемістити вниз"><ArrowDown size={14} /></button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {item.time_label && (
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full whitespace-nowrap border border-orange-200/50">
                      {item.time_label}
                    </span>
                  )}
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[10px] font-bold border",
                    item.status === 'published' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"
                  )}>
                    {item.status === 'published' ? 'Опубліковано' : 'Чернетка'}
                  </span>
                  {item.title && <span className="text-xs font-bold text-gray-700 truncate max-w-sm">{item.title}</span>}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{item.text}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.status !== 'published' && (
                  <button
                    onClick={() => publishMutation.mutate(item.id)}
                    className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    title="Опублікувати"
                  >
                    <Send size={15} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Редагувати"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => { if (confirm('Видалити оголошення?')) deleteMutation.mutate(item.id); }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Видалити"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      {!form && (
        <button
          onClick={() => setForm(emptyForm(currentDate))}
          className="admin-btn-secondary w-full border-dashed py-3 flex items-center justify-center gap-2.5 text-sm hover:border-blue-400 hover:bg-blue-50/30"
        >
          <Plus size={16} /> Додати нове оголошення
        </button>
      )}
    </div>
  );
}
