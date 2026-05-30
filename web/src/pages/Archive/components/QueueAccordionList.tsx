import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: 0, paddingRight: 0, paddingBottom: '80px' }}>
      {QUEUES.map((qNum) => {
        const isOpen = openQueue === qNum;
        
        const sq1 = `${qNum}.1`;
        const sq2 = `${qNum}.2`;

        const bitstring1 = dayData.queues[sq1] || '1'.repeat(48);
        const bitstring2 = dayData.queues[sq2] || '1'.repeat(48);

        const stats1 = dayData.meta.stats?.[sq1];
        const stats2 = dayData.meta.stats?.[sq2];

        const isUserPrimary = selectedGroup ? parseInt(selectedGroup.split('.')[0], 10) === qNum : false;

        return (
          <div 
            key={qNum} 
            className={clsx(
              "archive-accordion transition-all duration-300 border",
              isOpen ? "border-orange-500/20 shadow-md" : "border-zinc-200 dark:border-white/5",
              isUserPrimary && !isOpen && "border-orange-500/10 bg-orange-500/[0.02]"
            )}
            style={{ 
              margin: '0 20px 8px 20px', 
              width: 'calc(100% - 40px)', 
              boxSizing: 'border-box' 
            }}
          >
            {/* Header Accordion bar */}
            <div 
              onClick={() => handleToggle(qNum)}
              className="accordion-header flex items-center justify-between select-none cursor-pointer"
              style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}
            >
              <div className="flex items-center gap-2">
                <span className={clsx("text-[14px] font-black", isOpen ? "text-orange-500" : "text-zinc-800 dark:text-white")}>
                  ЧЕРГА {qNum}
                </span>
                {isUserPrimary && (
                  <span 
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: '#f97316', 
                      display: 'inline-block', 
                      boxShadow: '0 0 6px #f97316', 
                      marginLeft: '2px'
                    }} 
                    title="Ваша черга" 
                  />
                )}
              </div>
              
              <ChevronDown 
                size={14} 
                className={clsx(
                  "accordion-arrow text-zinc-400 transition-transform duration-300",
                  isOpen && "transform rotate-180 text-orange-500"
                )}
              />
            </div>

            {/* Inner Content of Accordion */}
            <div 
              className="accordion-content transition-all duration-300 ease-in-out"
              style={{ 
                maxHeight: isOpen ? '360px' : '0px',
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none'
              }}
            >
              <div className="bg-zinc-50/50 dark:bg-black/10 border-t border-zinc-200 dark:border-white/5" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Subqueue .1 */}
                <MiniTimeline 
                  queueId={sq1} 
                  bitstring={bitstring1} 
                  stats={stats1}
                />
                
                <div className="h-px bg-zinc-200 dark:bg-white/5" style={{ marginTop: '8px', marginBottom: '8px' }} />

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
