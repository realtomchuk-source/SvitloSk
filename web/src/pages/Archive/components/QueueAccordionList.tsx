import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { MiniTimeline } from './MiniTimeline';
import type { ArchivedDay } from '../types/archive';

interface QueueAccordionListProps {
  dayData: ArchivedDay; // Outage schedules for the selected day
}

const QUEUES = [1, 2, 3, 4, 5, 6];

export const QueueAccordionList: React.FC<QueueAccordionListProps> = ({ dayData }) => {
  const { selectedGroup } = useStore(); // Reads the user's start group from global Zustand store
  const [openQueue, setOpenQueue] = useState<number | null>(null);

  // Auto-focus user's primary group on load/date change
  useEffect(() => {
    if (selectedGroup) {
      const primaryGroup = parseInt(selectedGroup.split('.')[0], 10);
      if (QUEUES.includes(primaryGroup)) {
        setOpenQueue(primaryGroup);
      }
    } else {
      setOpenQueue(1);
    }
  }, [selectedGroup, dayData.date]);

  const handleToggle = (queueNum: number) => {
    setOpenQueue(prev => (prev === queueNum ? null : queueNum));
  };

  // Smart Auto-folding of active queue due to inactivity / idle state
  useEffect(() => {
    if (openQueue === null) return;

    let timeoutId: any;

    const startTimer = () => {
      timeoutId = setTimeout(() => {
        setOpenQueue(null);
      }, 8000); // Auto-fold after 8 seconds of idle time
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      startTimer();
    };

    startTimer();

    // Listen to user interactions inside the window to reset idle timer
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [openQueue]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: 0, paddingRight: 0, paddingBottom: '80px' }}>
      {QUEUES.map((qNum) => {
        const isOpen = openQueue === qNum;
        
        const sq1 = `${qNum}.1`;
        const sq2 = `${qNum}.2`;

        const bitstring1 = dayData.queues?.[sq1] || '1'.repeat(48);
        const bitstring2 = dayData.queues?.[sq2] || '1'.repeat(48);

        const stats1 = dayData.meta?.stats?.[sq1];
        const stats2 = dayData.meta?.stats?.[sq2];

        const isUserPrimary = selectedGroup ? parseInt(selectedGroup.split('.')[0], 10) === qNum : false;

        return (
          <div 
            key={qNum} 
            className={clsx(
              "archive-accordion transition-all duration-300 border",
              isOpen ? "border-[#EE7221]/20 shadow-md" : "border-zinc-200 dark:border-white/5",
              isUserPrimary && !isOpen && "border-[#EE7221]/15 bg-[#EE7221]/[0.02]"
            )}
            style={{ 
              margin: '0 20px 8px 20px', 
              width: 'calc(100% - 40px)', 
              boxSizing: 'border-box' 
            }}
          >
            {/* Header Accordion bar (Visible only when collapsed) */}
            {!isOpen && (
              <div 
                onClick={() => handleToggle(qNum)}
                className="accordion-header flex items-center justify-between select-none cursor-pointer"
                style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-zinc-800 dark:text-white">
                    ЧЕРГА {qNum}
                  </span>
                  {isUserPrimary && (
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: '#EE7221', 
                        display: 'inline-block', 
                        boxShadow: '0 0 6px #EE7221', 
                        marginLeft: '2px'
                      }} 
                      title="Ваша черга" 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Inner Content of Accordion (Expanded) */}
            <div 
              className="accordion-content transition-all duration-300 ease-in-out"
              style={{ 
                maxHeight: isOpen ? '360px' : '0px',
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none'
              }}
            >
              <div 
                onClick={() => setOpenQueue(null)}
                className="bg-zinc-50/50 dark:bg-black/10 cursor-pointer" 
                style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '14px', paddingBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                title="Клацніть, щоб згорнути"
              >
                {/* Subqueue .1 */}
                <MiniTimeline 
                  queueId={sq1} 
                  bitstring={bitstring1} 
                  stats={stats1}
                />
                
                {/* Soft horizontal divider between subqueues */}
                <div 
                  className="border-t border-zinc-200 dark:border-white/5" 
                  style={{ height: '0px', width: '100%' }} 
                />
                
                {/* Subqueue .2 */}
                <MiniTimeline 
                  queueId={sq2} 
                  bitstring={bitstring2} 
                  stats={stats2}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
