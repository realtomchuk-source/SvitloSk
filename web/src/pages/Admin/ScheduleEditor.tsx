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
    const cellH = 56; // Spacious row height for stacked title and staggered ticks
    const pad = 12; // Reduced padding for high symmetry
    const logoH = 50; // Brand icon squircle height

    const canvasW = 734; // Symmetrical canvas width for Telegram

    // Define section heights and vertical anchors sequentially to guarantee perfect vertical spacing and symmetry
    const headerH = 46; // Tighter header height to align with 30px date plate
    const gridStartY = pad + headerH + 18; // 12 + 46 + 18 = 76 px (spacious gap below header)
    const gridHeight = cellH * GROUPS.length; // 56 * 12 = 672 px
    
    // Legend Y level
    const legendY = gridStartY + gridHeight + 24; // 76 + 672 + 24 = 772 px

    // Icon Y level next to the Legend
    const logoY = legendY - 20; // 752 px (bottom at 802 px, center aligned with legend indicators)

    // Symmetrical, ultra-tight card bottom padding (16px below the bottom-most element, which is the 50px icon)
    const canvasH = logoY + logoH + 16 + pad / 2; // 752 + 50 + 16 + 6 = 824 px

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    // Enable high-quality anti-aliasing
    ctx.imageSmoothingEnabled = true;

    // Outer Background (premium soft light gray)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw main card background with a premium rounded card look
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(pad - 6, pad - 6, canvasW - pad * 2 + 12, canvasH - pad * 2 + 12, 12);
    ctx.fill();

    // 1. BRANDING HEADER
    // Left: Day and Date styled inside a premium dark badge matching the bottom icon
    const dateObj = new Date(selectedDate);
    const ukrDays = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const dayOfWeek = ukrDays[dateObj.getDay()];
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const yearShort = dateObj.getFullYear().toString().slice(-2);
    const dateStr = `${day}.${month}.${yearShort}`;

    const plateX = pad + 6;
    const plateY = pad + 10;
    const plateW = 92;
    const plateH = 30;

    // Draw dark rounded date badge (#374151)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, 6);
    ctx.fill();

    // Weekday and Date written in a single unified font style (no different fonts)
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    
    // Day of week in Orange
    ctx.fillStyle = '#EE7221';
    ctx.fillText(dayOfWeek, plateX + 10, plateY + 19);

    // Date value in White
    ctx.fillStyle = '#ffffff';
    ctx.fillText(` ${dateStr}`, plateX + 10 + ctx.measureText(dayOfWeek).width, plateY + 19);

    // Center/Right: Enlarged Title in a single line, perfectly aligned horizontally on the exact same level as the date plate
    ctx.textAlign = 'right'; // Right-align to perfectly balance the left-aligned date plate and achieve premium symmetry
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b'; // slate-800
    // Dynamic size scaling: Increased to 17px bold to make the title grand, highly visible, and perfectly balanced
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText('ГРАФІК ЗНЕСТРУМЛЕНЬ В СТАРОКОСТЯНТИНІВСЬКІЙ ГРОМАДІ', canvasW - pad - 6, plateY + plateH / 2);
    ctx.textBaseline = 'alphabetic'; // Reset baseline to default for subsequent text drawing

    const gridStartX = pad + 6; // 18 px (Left inner padding matching date badge)
    const gridEndX = canvasW - pad - 6; // 716 px (Right inner padding matching title)
    const cellW = (gridEndX - gridStartX) / 24; // Width of a single 1-hour segment

    // 2. DRAWING CONTINUOUS SEGMENTED BARS WITH STAGGERED HOUR TICKS (SvitloSk native app style)
    GROUPS.forEach((group, gi) => {
      const y = gridStartY + gi * cellH;

      // Group label above the bar (e.g. 'ПІДЧЕРГА 1.1') - matched to app native style
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ПІДЧЕРГА ${group}`, gridStartX, y + 14);

      const barH = 6; // Ultra-sleek continuous progress-bar line matching the app archive page
      const barY = y + 36; // Positioned perfectly below the label and top ticks space

      ctx.save();
      // Create a rounded clipping path for the entire 24-hour bar to get perfect pill-shaped ends
      ctx.beginPath();
      ctx.roundRect(gridStartX, barY, gridEndX - gridStartX, barH, barH / 2);
      ctx.clip();

      // Draw 24 segments side-by-side inside the clipped rounded region
      const row = grid[group];
      for (let h = 0; h < 24; h++) {
        const x = gridStartX + h * cellW;
        const isLit = row[h] === '1';
        ctx.fillStyle = isLit ? '#EE7221' : '#374151';
        // Add 0.5px subpixel overlap to eliminate anti-aliasing rendering gaps
        ctx.fillRect(x - 0.25, barY, cellW + 0.5, barH);
      }
      ctx.restore();

      // 3. DYNAMIC HOUR TICKS FOR STATE CHANGES & DAY BOUNDARIES (SvitloSk dynamic transition style)
      const ticks: { hour: number; isOrange: boolean }[] = [];

      // Day start (00:00)
      ticks.push({ hour: 0, isOrange: row[0] === '1' });

      // State transitions during the day
      for (let h = 1; h < 24; h++) {
        const prev = row[h - 1];
        const curr = row[h];
        if (prev !== curr) {
          ticks.push({ hour: h, isOrange: curr === '1' });
        }
      }

      // Day end (24:00)
      ticks.push({ hour: 24, isOrange: row[23] === '1' });

      // Draw Ticks and colored vertical lines ("риски")
      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.lineWidth = 1;

      ticks.forEach(({ hour, isOrange }) => {
        const x = gridStartX + hour * cellW;
        const label = `${hour.toString().padStart(2, '0')}:00`;
        
        ctx.fillStyle = isOrange ? '#EE7221' : '#64748b'; // Orange for light on, Grey for light off
        ctx.strokeStyle = isOrange ? '#EE7221' : '#64748b';

        // Handle alignment at edges to prevent clipping inside card
        if (hour === 0) ctx.textAlign = 'left';
        else if (hour === 24) ctx.textAlign = 'right';
        else ctx.textAlign = 'center';

        if (isOrange) {
          // Top Tick: Label + Tick line (Light turn on)
          ctx.textBaseline = 'bottom';
          ctx.fillText(label, x, barY - 5);
          
          // Draw orange vertical tick line down to the bar
          ctx.beginPath();
          ctx.moveTo(x, barY);
          ctx.lineTo(x, barY - 4);
          ctx.stroke();
        } else {
          // Bottom Tick: Label + Tick line (Light turn off)
          ctx.textBaseline = 'top';
          ctx.fillText(label, x, barY + barH + 5);
          
          // Draw grey vertical tick line up to the bar
          ctx.beginPath();
          ctx.moveTo(x, barY + barH);
          ctx.lineTo(x, barY + barH + 4);
          ctx.stroke();
        }
      });
      ctx.textBaseline = 'alphabetic'; // Reset baseline to default for subsequent drawings
    });

    // 6. LEGEND AND SUMMARY STATS
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';

    // "Світло є" Indicator (Orange `#EE7221`)
    ctx.fillStyle = '#EE7221';
    ctx.beginPath();
    ctx.roundRect(gridStartX, legendY - 2, 12, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    const litPct = Math.round((litCells / totalCells) * 100);
    ctx.fillText(`Світло є: ${litPct}% часу (~${Math.round(litCells / GROUPS.length)} год)`, gridStartX + 18, legendY + 8);

    // "Світла немає" Indicator (Dark Gray `#374151`)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.roundRect(gridStartX + 240, legendY - 2, 12, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    const darkPct = Math.round((darkCells / totalCells) * 100);
    ctx.fillText(`Відключення: ${darkPct}% часу (~${Math.round(darkCells / GROUPS.length)} год)`, gridStartX + 258, legendY + 8);

    // Right side: SvitloSk Brand Icon relocated up next to the Legend Y level
    const logoX = gridEndX - logoH; // Align right side with grid cells right margin

    // 1. Draw rounded square background (#374151)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoH, logoH, 10);
    ctx.fill();

    // 2. Load vector paths of SvitloSk custom bulb-plug logo
    const path1 = new Path2D('M336 409.33C334.83 508.55 159.82 495.2 176 396H336V409.33Z');
    const path2 = new Path2D('M256 36C118.69 31.25 43.56 211.41 139.92 306.09C153.66 320.59 165.91 337.42 171.91 356H244.66V278.23C204.38 270.82 189.03 233.61 193.14 195.47C179.44 195.42 179.44 174.57 193.14 174.52H214.09V143.09C214.09 137.3 218.77 132.61 224.57 132.61C230.37 132.61 235.05 137.29 235.05 143.09V174.52H276.95V143.09C276.95 137.3 281.63 132.61 287.43 132.61C293.23 132.61 297.91 137.29 297.91 143.09V174.52H318.86C332.56 174.57 332.56 195.42 318.86 195.47C322.98 233.61 307.59 270.84 267.34 278.23V356H340.09C346.17 337.42 358.34 320.58 372.09 306.08C468.46 211.41 393.29 31.22 256.01 36H256Z');

    // 3. Draw vector logo paths precisely scaled and centered inside squircle background
    ctx.save();
    ctx.translate(logoX + 7.5, logoY + 7.5); // Center inside 50x50 squircle (35x35 active region)
    ctx.scale(35 / 512, 35 / 512); // Scale from 512 viewport down to 35px
    ctx.fillStyle = '#EE7221'; // Official Brand Orange
    ctx.fill(path1);
    ctx.fill(path2);
    ctx.restore();

    // 7. WATERMARK / SYSTEM TEXT (Moved to the left of the brand icon, aligned with the bottom of the icon/green line)
    const formattedGenTime = `${new Date().toLocaleDateString('uk-UA')} ${new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})}`;
    const systemText = `Сформовано системою SvitloSk • ${formattedGenTime}`;
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '500 10.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom'; // Sits exactly on the green line (bottom level of the icon squircle)
    ctx.fillText(systemText, logoX - 12, logoY + logoH - 2); // 2px margin from the absolute bottom edge
    ctx.textBaseline = 'alphabetic'; // Reset baseline to default for subsequent text drawing

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {hasChanges && (
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">Не збережено</span>
          )}
          {status && (
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-250 animate-in fade-in duration-200">{status}</span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:max-w-[200px]">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setHasChanges(true); }}
            className="admin-input"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Grid actions group */}
        <div className="flex items-center gap-1.5">
          <button onClick={fillAll} className="admin-btn-secondary !text-[#EE7221] hover:!bg-[#EE7221]/10 hover:!border-[#EE7221]/30">
            <CheckSquare size={14} /> Все ✔
          </button>
          <button onClick={clearAll} className="admin-btn-secondary">
            <XSquare size={14} /> Очистити ✘
          </button>
          <button onClick={invertAll} className="admin-btn-secondary !text-blue-600 hover:!bg-blue-50 hover:!border-blue-200">
            <RefreshCw size={14} /> Інвертувати ↻
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 self-center mx-1 hidden sm:block" />

        {/* Save + Load group */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleSave} className="admin-btn-primary">
            <Save size={14} /> Зберегти
          </button>
          <button onClick={handleLoadFromParser} className="admin-btn-secondary">
            <Upload size={14} /> З парсера
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 self-center mx-1 hidden sm:block" />

        {/* Export group */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleExportJSON} className="admin-btn-secondary">
            <Download size={14} /> JSON
          </button>
          <button onClick={handleExportPNG} className="admin-btn-secondary !text-purple-650 hover:!bg-purple-50 hover:!border-purple-200">
            <Image size={14} /> PNG для Telegram
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="admin-system-board overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-[10px] text-center text-gray-400 font-mono font-bold">{i.toString().padStart(2, '0')}</div>
            ))}
          </div>
          {/* Grid rows */}
          <div className="space-y-1">
            {GROUPS.map(group => (
              <div key={group} className="flex items-center gap-2">
                <span className="w-8 text-xs font-bold text-gray-400 font-mono text-right">{group}</span>
                <div className="flex-1 flex gap-0.5">
                  {grid[group].split('').map((bit, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(group, i)}
                      className={clsx(
                        "flex-1 h-7 rounded transition-all cursor-pointer",
                        bit === '1'
                          ? "bg-[#EE7221] hover:bg-[#d96216] shadow-sm shadow-[#EE7221]/20"
                          : "bg-[#374151] hover:bg-[#2a323f] shadow-sm shadow-[#374151]/20"
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
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#EE7221]/10 text-[#EE7221] rounded-xl text-xs font-extrabold shadow-sm border border-[#EE7221]/20">
          <div className="w-3 h-3 bg-[#EE7221] rounded-sm shrink-0" /> Світло є: {litCells} ({Math.round(litCells / totalCells * 100)}%)
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#374151]/10 text-[#374151] rounded-xl text-xs font-extrabold shadow-sm border border-[#374151]/20">
          <div className="w-3 h-3 bg-[#374151] rounded-sm shrink-0" /> Відключення: {darkCells} ({Math.round(darkCells / totalCells * 100)}%)
        </div>
      </div>

      {/* Archive List */}
      {savedDates.length > 0 && (
        <div className="admin-system-board flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={15} className="text-blue-600" /> Збережені графіки ({savedDates.length})
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {savedDates.map(date => (
              <div key={date} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-2 py-1.5 shadow-sm hover:border-gray-300 transition-colors">
                <button
                  onClick={() => handleLoadFromArchive(date)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {toShortDate(date)}
                </button>
                <button
                  onClick={() => handleDelete(date)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
