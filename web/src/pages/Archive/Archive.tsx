import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { useArchiveData } from './hooks/useArchiveData';
import { CalendarWidget } from './components/CalendarWidget';
import { QueueAccordionList } from './components/QueueAccordionList';

export const Archive: React.FC = () => {
  const navigate = useNavigate();
  const {
    savedDates,
    selectedDayData,
    isLoading,
    isInitializing,
    error,
    thresholdDate,
    loadDayData
  } = useArchiveData();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showTransitModal, setShowTransitModal] = useState(false);

  // Set initial selected date once threshold date is resolved
  useEffect(() => {
    if (thresholdDate) {
      setSelectedDate(thresholdDate);
      loadDayData(thresholdDate);
    }
  }, [thresholdDate, loadDayData]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    loadDayData(date);
  };

  const handleTransitAlert = () => {
    setShowTransitModal(true);
  };

  const formatUKDate = (isoString: string) => {
    if (!isoString) return '';
    const [year, month, day] = isoString.split('-');
    return `${day}.${month}.${year}`;
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#050505] animate-pulse">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div className="text-zinc-500 text-sm font-semibold tracking-wider uppercase">Ініціалізація архіву...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-archive min-h-screen text-zinc-900 dark:text-zinc-100 bg-[#F5F5F7] dark:bg-[#08060d] transition-colors duration-500" style={{ paddingBottom: '96px' }}>
      
      {/* Header section (Aesthetic Silver / Dark glass header) */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#08060d]/70 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 flex items-center justify-between" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', boxSizing: 'border-box' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
            title="Назад на Головну"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[17px] font-black text-zinc-900 dark:text-white m-0 p-0 tracking-wide uppercase">Архів графіків</h1>
            <span className="text-[11px] font-bold text-zinc-400 block tracking-widest mt-0.5">ІСТОРІЯ ВІДКЛЮЧЕНЬ</span>
          </div>
        </div>
        
        <div className="p-2 text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-full" title="Люфт архіву складає 1 добу">
          <Info size={16} />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[450px] mx-auto" style={{ marginTop: '28px', paddingLeft: 0, paddingRight: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* PWA Section Label */}
        <div className="pwa-page-label text-center text-xs font-black tracking-widest text-zinc-500 uppercase" style={{ marginTop: '16px', marginBottom: '16px' }}>
          КАЛЕНДАР АРХІВУ
        </div>

        {/* 1. Calendar Widget */}
        <CalendarWidget 
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          savedDates={savedDates}
          thresholdDate={thresholdDate}
          onTransitClick={handleTransitAlert}
        />

        {/* Selected date header */}
        <div className="flex items-center justify-between py-1" style={{ paddingLeft: '36px', paddingRight: '36px', boxSizing: 'border-box' }}>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-orange-500" />
            <span className="text-[14px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Дані за {formatUKDate(selectedDate)}
            </span>
          </div>
        </div>

        {/* 2. Harmonica / Details lists */}
        {isLoading ? (
          <div className="bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-[2rem] text-center flex flex-col items-center justify-center" style={{ padding: '48px', marginLeft: '20px', marginRight: '20px' }}>
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Завантаження розкладів...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] text-center" style={{ padding: '24px', marginLeft: '20px', marginRight: '20px' }}>
            <p className="text-red-400 text-sm font-semibold">{error}</p>
            <button 
              onClick={() => loadDayData(selectedDate)}
              className="mt-3 text-xs font-bold text-orange-400 hover:text-orange-300 underline"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : selectedDayData ? (
          <QueueAccordionList dayData={selectedDayData} />
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-900/20 rounded-[2rem] border border-zinc-200 dark:border-white/5 text-center" style={{ padding: '40px', marginLeft: '20px', marginRight: '20px' }}>
            <p className="text-zinc-500 italic">Виберіть дату на календарі для перегляду розкладу.</p>
          </div>
        )}

      </main>

      {/* ⚠️ Dynamic Date (Vchora/Sohodni) Warning Overlay */}
      {showTransitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: 9999 }}>
          <div 
            className="bg-white dark:bg-[#121118] border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center"
            style={{ 
              maxWidth: '340px', 
              width: '100%', 
              padding: '24px', 
              boxSizing: 'border-box' 
            }}
          >
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-orange-500" />
            </div>

            <h3 className="text-[16px] font-black text-zinc-900 dark:text-white uppercase tracking-wide mb-2">
              Динамічний графік
            </h3>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6" style={{ margin: '0 0 24px 0', padding: '0 8px' }}>
              Графіки за вчора, сьогодні та завтра є динамічними й можуть постійно коригуватися. Вони доступні безпосередньо на Головній сторінці.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button
                onClick={() => {
                  setShowTransitModal(false);
                  navigate('/');
                }}
                className="w-full bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 active:scale-95 transition-all shadow-[0_4px_12px_rgba(238,114,33,0.3)] border-none"
                style={{ height: '44px', cursor: 'pointer', outline: 'none' }}
              >
                Перейти на Головну
              </button>
              <button
                onClick={() => setShowTransitModal(false)}
                className="w-full bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                style={{ height: '44px', cursor: 'pointer', outline: 'none' }}
              >
                Залишитись в Архіві
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
