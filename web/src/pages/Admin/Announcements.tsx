import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Megaphone, Trash2, Send, Plus, Clock, Edit2, ArrowUp, ArrowDown, Eye, X, GripVertical } from 'lucide-react';
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

const emptyForm = (date: string): FormData => ({
  title: '',
  text: '',
  time_label: '',
  active_date: date,
});

/** YYYY-MM-DD for today */
const todayISO = () => new Date().toISOString().split('T')[0];

/** YYYY-MM-DD for tomorrow */
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

/** DD.MM format */
const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
};

export function Announcements() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [form, setForm] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useStore();
  const queryClient = useQueryClient();

  const today = todayISO();
  const tomorrow = tomorrowISO();
  const currentDate = activeTab === 'today' ? today : tomorrow;

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
      await logAdminAction(isPublished ? 'publish_announcement' : 'draft_announcement', created.id, { title: data.title });
    },
    onSuccess: () => { invalidate(); setForm(null); setEditingId(null); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: FormData & { id: string; status: string }) => {
      const isPublished = data.status === 'published';
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
        .eq('id', id);
      if (error) throw error;
      await logAdminAction('update_announcement_status', id, { title: data.title, status: data.status });
    },
    onSuccess: () => { invalidate(); setForm(null); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_announcements').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction('delete_announcement', id);
    },
    onSuccess: invalidate,
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_announcements')
        .update({ status: 'published', is_active: true })
        .eq('id', id);
      if (error) throw error;
      await logAdminAction('publish_announcement', id);
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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => { setActiveTab('today'); setForm(null); setEditingId(null); }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              activeTab === 'today' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Megaphone size={14} /> Сьогодні ({shortDate(today)})
            {todayCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{todayCount}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('tomorrow'); setForm(null); setEditingId(null); }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              activeTab === 'tomorrow' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Clock size={14} /> Завтра ({shortDate(tomorrow)})
            {tomorrowCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{tomorrowCount}</span>}
          </button>
        </div>
        <button
          onClick={() => setShowPreview(p => !p)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            showPreview ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:text-gray-700"
          )}
        >
          <Eye size={14} /> Попередній перегляд
        </button>
      </div>

      {/* Preview Banner */}
      {showPreview && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold mb-2">Попередній перегляд бігучої стрічки:</p>
          <div className="bg-gray-900 rounded-lg px-4 py-2.5 overflow-hidden">
            <div className="flex gap-6 whitespace-nowrap animate-marquee-preview text-sm">
              {announcements.filter(a => a.status === 'published').length === 0 ? (
                <span className="text-gray-500 italic text-xs">Немає опублікованих оголошень для цієї дати</span>
              ) : (
                announcements.filter(a => a.status === 'published').map((a, i) => (
                  <span key={a.id} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-gray-600 mx-2">•</span>}
                    {a.time_label && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">{a.time_label}</span>
                    )}
                    <span className="text-white text-xs">{a.text}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form (create/edit) */}
      {form && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              {editingId ? 'Редагування оголошення' : 'Нове оголошення'}
            </h4>
            <button onClick={() => { setForm(null); setEditingId(null); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.time_label}
              onChange={(e) => setForm({ ...form, time_label: e.target.value })}
              placeholder="Час (наприклад: 12:00-16:00)"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 bg-white"
            />
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Заголовок (необов'язково)"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 bg-white"
            />
          </div>
          <div className="relative">
            <textarea
              value={form.text}
              onChange={(e) => {
                if (e.target.value.length <= charMax) {
                  setForm({ ...form, text: e.target.value });
                }
              }}
              placeholder="Текст оголошення (вулиці, деталі...)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 bg-white resize-none"
            />
            <span className={clsx(
              "absolute bottom-2 right-3 text-[10px] font-mono",
              charCount > charMax * 0.9 ? "text-red-500" : "text-gray-300"
            )}>
              {charCount}/{charMax}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={!form.text.trim()}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Зберегти чернетку
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={!form.text.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              <Send size={12} /> Опублікувати
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-2">
        {announcements.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Megaphone size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Немає оголошень на {shortDate(currentDate)}</p>
          </div>
        ) : (
          announcements.map((item, index) => (
            <div
              key={item.id}
              className={clsx(
                "bg-white border rounded-lg p-4 group transition-all",
                item.status === 'published' ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Sort handle */}
                <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp size={12} /></button>
                  <GripVertical size={12} className="text-gray-300" />
                  <button onClick={() => handleMoveDown(index)} disabled={index === announcements.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown size={12} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {item.time_label && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full whitespace-nowrap">
                        {item.time_label}
                      </span>
                    )}
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold",
                      item.status === 'published' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {item.status === 'published' ? 'Опубліковано' : 'Чернетка'}
                    </span>
                    {item.title && <span className="text-xs font-semibold text-gray-700 truncate">{item.title}</span>}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.text}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {item.status !== 'published' && (
                    <button
                      onClick={() => publishMutation.mutate(item.id)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                      title="Опублікувати"
                    >
                      <Send size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    title="Редагувати"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Видалити оголошення?')) deleteMutation.mutate(item.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Видалити"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      {!form && (
        <button
          onClick={() => setForm(emptyForm(currentDate))}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
        >
          <Plus size={16} /> Додати оголошення
        </button>
      )}

      {/* Inline marquee preview CSS */}
      <style>{`
        @keyframes marquee-preview-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-preview {
          animation: marquee-preview-scroll 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
