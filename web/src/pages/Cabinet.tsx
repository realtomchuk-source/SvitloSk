import React from 'react';
import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { ShieldCheck } from 'lucide-react';

export const Cabinet: React.FC = () => {
  const { slots, userConfig, updateUserConfig } = useStore();

  const handleToggleTomorrow = () => {
    updateUserConfig({ tomorrowPush: !userConfig.tomorrowPush });
  };

  return (
    <section id="cabinet-section-v3" className="cabinet-container-v3 animate-in fade-in duration-500">
      <div className="v3-section">
        {/* Original Profile Header Style */}
        <div className="profile-card-v3">
            <div className="v3-profile-left">
                <div className="v3-avatar-wrap">
                    <ShieldCheck size={32} className="text-orange-500" />
                </div>
                <div className="v3-profile-text">
                    <div className="v3-profile-name">Локальний режим</div>
                    <div className="v3-profile-sub">Дані збережено у вашому браузері</div>
                </div>
            </div>
        </div>
      </div>

      <div className="v3-section">
        <h3 className="v3-section-title">Налаштування сповіщень</h3>
        <div className="v3-cards-container flex flex-col gap-3">
          {/* We'll use your original slot styles here */}
          {slots.length > 0 ? slots.map(slot => (
             <div key={slot.id} className="v3-slot-card active">
                <div className="v3-slot-main">
                    <div className="v3-slot-title">{slot.locationName}</div>
                    <div className="v3-slot-group">{slot.group}</div>
                </div>
                <div className="v3-slot-footer">
                    <span>за {slot.notifyTime} хв</span>
                </div>
             </div>
          )) : (
            <div className="v3-slot-card empty text-center p-8 opacity-30 italic">
                Слоти сповіщень (у розробці)
            </div>
          )}
        </div>
      </div>

      <div className="cabinet-section">
        <div className="soft-container">
            <div className="soft-item">
                <div className="soft-left">
                    <svg className="soft-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <div className="soft-label">Стартова підчерга</div>
                </div>
                <div style={{display:'flex', alignItems:'center'}}>
                    <div className="soft-value">{userConfig.startGroup}</div>
                    <div className="soft-chevron">›</div>
                </div>
            </div>
            
            <div className="soft-item" onClick={handleToggleTomorrow}>
                <div className="soft-left">
                    <svg className="soft-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <div className="soft-label">Графік на завтра</div>
                </div>
                <div className={clsx("v3-toggle", userConfig.tomorrowPush && "active")}></div>
            </div>
        </div>
      </div>

      <div className="cabinet-section">
        <div className="light-list">
            <div className="light-item">
                <div className="light-left">
                    <svg className="light-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <div className="light-label">Про застосунок</div>
                </div>
                <div className="light-chevron">›</div>
            </div>
            <div className="light-item">
                <div className="light-left">
                    <svg className="light-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <div className="light-label">Зворотний зв'язок</div>
                </div>
                <div className="light-chevron">›</div>
            </div>
        </div>
      </div>
    </section>
  );
};
