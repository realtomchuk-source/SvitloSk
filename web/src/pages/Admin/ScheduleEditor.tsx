import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/db';
import { clsx } from 'clsx';
import { Save, Upload, Download, Trash2, CheckSquare, XSquare, RefreshCw, Calendar, Image } from 'lucide-react';

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2',
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

type ScheduleData = {
  date: string;
  queues: Record<string, string>;
  meta?: any;
};

/** Convert YYYY-MM-DD → DD.MM */
const toShortDate = (isoDate: string) => {
  const [, m, d] = isoDate.split('-');
  return `${d}.${m}`;
};

/** Convert DD.MM → YYYY-MM-DD (current year) */
const fromShortDate = (short: string) => {
  const [d, m] = short.split('.');
  const year = new Date().getFullYear();
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export function ScheduleEditor() {
  const todayISO = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [grid, setGrid] = useState<Record<string, string>>(
    Object.fromEntries(GROUPS.map(g => [g, '1'.repeat(24)]))
  );
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Load saved dates list
  const refreshDates = useCallback(async () => {
    try {
      const dates = await db.getAllScheduleDates();
      setSavedDates(dates.sort().reverse());
    } catch {
      // DB might not be ready yet
    }
  }, []);

  useEffect(() => { refreshDates(); }, [refreshDates]);

  // Show status message temporarily
  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // --- Grid Actions ---
  const handleCellClick = (group: string, hour: number) => {
    const current = grid[group];
    const bit = current[hour] === '1' ? '0' : '1';
    setGrid({ ...grid, [group]: current.substring(0, hour) + bit + current.substring(hour + 1) });
    setHasChanges(true);
  };

  const fillAll = () => {
    setGrid(Object.fromEntries(GROUPS.map(g => [g, '1'.repeat(24)])));
    setHasChanges(true);
  };

  const clearAll = () => {
    setGrid(Object.fromEntries(GROUPS.map(g => [g, '0'.repeat(24)])));
    setHasChanges(true);
  };

  const invertAll = () => {
    const inverted = Object.fromEntries(
      GROUPS.map(g => [g, grid[g].split('').map(b => b === '1' ? '0' : '1').join('')])
    );
    setGrid(inverted);
    setHasChanges(true);
  };

  // --- Save to IndexedDB ---
  const handleSave = async () => {
    if (!selectedDate) return;
    const schedule: ScheduleData = {
      date: selectedDate,
      queues: grid,
      meta: { source: 'manual', saved_at: new Date().toISOString() }
    };
    await db.saveSchedule(schedule);
    setHasChanges(false);
    showStatus(`Збережено: ${toShortDate(selectedDate)}`);
    refreshDates();
  };

  // --- Load from IndexedDB ---
  const handleLoadFromArchive = async (date: string) => {
    const schedule = await db.getSchedule(date);
    if (schedule) {
      setSelectedDate(date);
      setGrid(schedule.queues);
      setHasChanges(false);
      showStatus(`Завантажено з архіву: ${toShortDate(date)}`);
    }
  };

  // --- Load from today.json ---
  const handleLoadFromParser = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/today.json`);
      const data = await res.json();
      if (data.queues) {
        setGrid(data.queues);
        // Convert parser date format DD.MM → YYYY-MM-DD
        if (data.date) {
          setSelectedDate(fromShortDate(data.date));
        }
        setHasChanges(true);
        showStatus(`Завантажено з парсера: ${data.date || 'today'}`);
      }
    } catch (err) {
      showStatus('Помилка завантаження today.json');
    }
  };

  // --- Export PNG ---
  const handleExportPNG = () => {
    const cellW = 28;
    const cellH = 24;
    const labelW = 44;
    const headerH = 50;
    const hourRowH = 18;
    const legendH = 36;
    const pad = 16;

    const canvasW = labelW + cellW * 24 + pad * 2;
    const canvasH = headerH + hourRowH + cellH * GROUPS.length + legendH + pad * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Графік на ${toShortDate(selectedDate)}`, pad, pad + 18);

    // Subtitle
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`SvitloSk • ${new Date().toLocaleString('uk-UA')}`, pad, pad + 34);

    // Hour headers
    const gridStartX = pad + labelW;
    const gridStartY = headerH + hourRowH;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let h = 0; h < 24; h++) {
      ctx.fillText(h.toString().padStart(2, '0'), gridStartX + h * cellW + cellW / 2, headerH + 12);
    }

    // Grid
    GROUPS.forEach((group, gi) => {
      const y = gridStartY + gi * cellH;
      // Group label
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(group, pad + labelW - 6, y + cellH / 2 + 4);

      // Cells
      const row = grid[group];
      for (let h = 0; h < 24; h++) {
        const x = gridStartX + h * cellW;
        const isLit = row[h] === '1';
        ctx.fillStyle = isLit ? '#34d399' : '#fca5a5';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        // Cell border
        ctx.strokeStyle = isLit ? '#10b981' : '#f87171';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    });

    // Legend
    const legendY = gridStartY + GROUPS.length * cellH + 12;
    ctx.textAlign = 'left';
    ctx.font = '11px system-ui, sans-serif';
    // Light
    ctx.fillStyle = '#34d399';
    ctx.fillRect(pad + labelW, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText(`Світло: ${litCells} (${Math.round(litCells / totalCells * 100)}%)`, pad + labelW + 16, legendY + 10);
    // Dark
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(pad + labelW + 160, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText(`Відключення: ${darkCells} (${Math.round(darkCells / totalCells * 100)}%)`, pad + labelW + 176, legendY + 10);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_${selectedDate}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('PNG зображення скачано');
    }, 'image/png');
  };

  // --- Export JSON ---
  const handleExportJSON = () => {
    const schedule: ScheduleData = {
      date: toShortDate(selectedDate),
      queues: grid,
      meta: {
        source: 'manual',
        generated_at: new Date().toLocaleString('uk-UA'),
        target_date: toShortDate(selectedDate)
      }
    };
    const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('JSON файл скачано');
  };

  // --- Delete from archive ---
  const handleDelete = async (date: string) => {
    if (!confirm(`Видалити графік за ${toShortDate(date)}?`)) return;
    await db.deleteSchedule(date);
    showStatus(`Видалено: ${toShortDate(date)}`);
    refreshDates();
  };

  // Count stats
  const totalCells = GROUPS.length * 24;
  const litCells = Object.values(grid).reduce((sum, row) => sum + row.split('').filter(b => b === '1').length, 0);
  const darkCells = totalCells - litCells;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">Не збережено</span>
          )}
          {status && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full animate-in fade-in duration-200">{status}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setHasChanges(true); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-400 bg-white"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Grid actions group */}
        <div className="flex items-center gap-1.5">
          <button onClick={fillAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors">
            <CheckSquare size={14} /> Все ✔
          </button>
          <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <XSquare size={14} /> Очистити ✘
          </button>
          <button onClick={invertAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            <RefreshCw size={14} /> Інвертувати ↻
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 self-center mx-1" />

        {/* Save + Load group */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Save size={14} /> Зберегти
          </button>
          <button onClick={handleLoadFromParser} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={14} /> З парсера
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 self-center mx-1" />

        {/* Export group */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={14} /> JSON
          </button>
          <button onClick={handleExportPNG} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
            <Image size={14} /> PNG для Telegram
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-[10px] text-center text-gray-400 font-mono">{i.toString().padStart(2, '0')}</div>
            ))}
          </div>
          {/* Grid rows */}
          <div className="space-y-0.5">
            {GROUPS.map(group => (
              <div key={group} className="flex items-center gap-1.5">
                <span className="w-8 text-xs font-semibold text-gray-500 font-mono text-right">{group}</span>
                <div className="flex-1 flex gap-px">
                  {grid[group].split('').map((bit, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(group, i)}
                      className={clsx(
                        "flex-1 h-7 rounded-sm transition-all",
                        bit === '1'
                          ? "bg-emerald-400 hover:bg-emerald-500"
                          : "bg-red-300 hover:bg-red-400"
                      )}
                      title={`${group} — ${i.toString().padStart(2, '0')}:00 — ${bit === '1' ? 'Світло є' : 'Відключення'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
          <div className="w-3 h-3 bg-emerald-400 rounded-sm" /> Світло: {litCells} ({Math.round(litCells / totalCells * 100)}%)
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
          <div className="w-3 h-3 bg-red-300 rounded-sm" /> Відключення: {darkCells} ({Math.round(darkCells / totalCells * 100)}%)
        </div>
      </div>

      {/* Archive List */}
      {savedDates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar size={14} /> Збережені графіки ({savedDates.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedDates.map(date => (
              <div key={date} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-1 py-1">
                <button
                  onClick={() => handleLoadFromArchive(date)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {toShortDate(date)}
                </button>
                <button
                  onClick={() => handleDelete(date)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
