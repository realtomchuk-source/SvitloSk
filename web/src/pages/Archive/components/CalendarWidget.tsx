import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface CalendarWidgetProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  savedDates: string[]; // List of YYYY-MM-DD that have data
  thresholdDate: string; // Today - 2 days (YYYY-MM-DD)
  onTransitClick: () => void; // Called when clicking yesterday/today
}

const MONTHS_UK = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  onSelectDate,
  savedDates,
  thresholdDate,
  onTransitClick
}) => {
  const [currentYear, setCurrentYear] = useState<number>(() => new Date(selectedDate).getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date(selectedDate).getMonth()); // 0-indexed
  const [showFastSelector, setShowFastSelector] = useState(false);

  // Parse threshold and today dates
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute days grid for the selected month/year
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Convert 0 (Sunday) to 6, and 1-6 to 0-5
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: Array<{ dayNum: number; dateString: string; isCurrentMonth: boolean }> = [];
    
    // Fill offset from previous month (for padding)
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dayNum: d,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false
      });
    }

    // Fill current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        dayNum: d,
        dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true
      });
    }

    // Pad remaining spaces to form full weeks (multiple of 7)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dayNum: d,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Year choices for fast navigation (e.g. current year - 2 to current year + 2)
  const yearChoices = useMemo(() => {
    const startYear = new Date().getFullYear() - 3;
    return Array.from({ length: 6 }).map((_, i) => startYear + i);
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  const getDayStatus = (dateStr: string) => {
    const isFuture = dateStr > yesterday && dateStr !== today;
    const isTransit = dateStr === today || dateStr === yesterday;
    const isOldArchive = dateStr <= thresholdDate;
    const hasData = savedDates.includes(dateStr);

    return {
      isFuture,
      isTransit,
      isOldArchive,
      hasData
    };
  };

  const handleDayClick = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const status = getDayStatus(dateStr);

    if (status.isFuture) return;
    if (status.isTransit) {
      onTransitClick();
      return;
    }

    onSelectDate(dateStr);
  };

  return (
    <div 
      className="archive-calendar-card" 
      style={{ 
        padding: '16px', 
        margin: '0 20px 12px 20px', 
        width: 'calc(100% - 40px)', 
        borderRadius: '20px',
        boxSizing: 'border-box' 
      }}
    >
      {/* Header controls */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex gap-1.5">
          <button 
            onClick={handlePrevYear} 
            className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Попередній рік"
          >
            <ChevronsLeft size={18} />
          </button>
          <button 
            onClick={handlePrevMonth} 
            className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Попередній місяць"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <button 
          onClick={() => setShowFastSelector(prev => !prev)}
          className="text-[15px] font-bold text-zinc-800 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-full bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5"
          style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px' }}
        >
          {MONTHS_UK[currentMonth]} {currentYear}
        </button>

        <div className="flex gap-1.5">
          <button 
            onClick={handleNextMonth} 
            className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Наступний місяць"
          >
            <ChevronRight size={18} />
          </button>
          <button 
            onClick={handleNextYear} 
            className="p-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Наступний рік"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid of fast year/month selection */}
      {showFastSelector ? (
        <div className="animate-in fade-in zoom-in-95 duration-200 bg-white/90 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-3" style={{ padding: '12px', marginBottom: '12px' }}>
          <div className="text-xs font-bold text-zinc-500 text-center" style={{ marginBottom: '8px' }}>ШВИДКИЙ ВИБІР</div>
          
          {/* Years */}
          <div className="grid grid-cols-6 gap-1" style={{ marginBottom: '12px' }}>
            {yearChoices.map(y => (
              <button
                key={y}
                onClick={() => { setCurrentYear(y); }}
                className={clsx(
                  "text-[11px] font-semibold rounded-lg border transition-colors",
                  currentYear === y 
                    ? "bg-orange-500 text-white border-orange-500" 
                    : "bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                )}
                style={{ paddingTop: '4px', paddingBottom: '4px' }}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Months */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS_UK.map((m, idx) => (
              <button
                key={m}
                onClick={() => { setCurrentMonth(idx); setShowFastSelector(false); }}
                className={clsx(
                  "text-[11px] font-semibold rounded-lg border transition-colors",
                  currentMonth === idx 
                    ? "bg-orange-500 text-white border-orange-500" 
                    : "bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                )}
                style={{ paddingTop: '6px', paddingBottom: '6px' }}
              >
                {m.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5" style={{ marginBottom: '8px' }}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-[11px] font-black text-zinc-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map(({ dayNum, dateString, isCurrentMonth }) => {
          if (!isCurrentMonth) {
            // Padding cells (from surrounding months)
            return (
              <div 
                key={dateString} 
                className="aspect-square flex items-center justify-center text-[14px] text-zinc-700 opacity-20 pointer-events-none"
              >
                {dayNum}
              </div>
            );
          }

          const isSelected = dateString === selectedDate;
          const status = getDayStatus(dateString);

          return (
            <button
              key={dateString}
              onClick={() => handleDayClick(dateString, isCurrentMonth)}
              disabled={status.isFuture}
              className={clsx(
                "calendar-day relative flex flex-col items-center justify-center border transition-all duration-200",
                isSelected && "active",
                !isSelected && status.isTransit && "border-zinc-500/40 text-orange-400 bg-zinc-800/20",
                !isSelected && !status.isTransit && !status.isFuture && !status.hasData && "opacity-40 text-zinc-500 bg-transparent border-transparent",
                !isSelected && !status.isTransit && !status.isFuture && status.hasData && "text-white bg-zinc-800/40 border-white/5 hover:bg-zinc-800 hover:border-white/10",
                status.isFuture && "opacity-15 text-zinc-600 bg-transparent border-transparent cursor-not-allowed"
              )}
            >
              <span className="text-[13px] font-bold">{dayNum}</span>
              
              {/* Special Indicators */}
              {status.isTransit && !isSelected && (
                <Zap size={8} className="absolute top-1 right-1 text-orange-400 fill-orange-400 animate-pulse" />
              )}
              
              {status.hasData && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
