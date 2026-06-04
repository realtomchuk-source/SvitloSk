import React from 'react';
import type { Slot } from '@/schemas/user';
import { Moon, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import styles from '../Cabinet.module.css';

interface NotificationSlotsProps {
    slots: Slot[];
    isLocked?: boolean;
    onRequireAuth?: () => void;
    onEditSlot?: (slot: Slot) => void;
}

export const NotificationSlots: React.FC<NotificationSlotsProps> = ({ slots, isLocked, onRequireAuth, onEditSlot }) => {
    // We always want to show exactly 2 slots
    const displaySlots = slots.length >= 2 ? slots.slice(0, 2) : slots;

    const renderSlotContent = (slot: Slot, index: number) => {
        const isNotConfigured = !slot.name || !slot.subGroup;
        const defaultLabel = index === 0 ? 'Робота' : 'Дім';

        if (isNotConfigured) {
            return (
                <div className={styles.slotCard} style={{ opacity: 0.5 }}>
                    <div className={styles.slotTopRow}>
                        <span className={styles.slotTitle} style={{ color: '#a1a1aa' }}>{defaultLabel}</span>
                        <div className={styles.slotGroup}>0.0</div>
                    </div>
                    <div className={styles.slotBottomRow}>
                        <span className={styles.slotDnd} style={{ color: '#a1a1aa' }}>Натисніть для налаштування</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={clsx(styles.slotCard, styles.slotCardConfigured)}>
                {slot.isActive && <div className={styles.activeIndicator} />}
                
                <div className={styles.slotTopRow}>
                    <span className={styles.slotTitle}>{slot.name}</span>
                    <div className={clsx(styles.slotGroup, slot.isActive && styles.slotGroupActive)}>
                        {slot.subGroup}
                    </div>
                </div>

                <div className={styles.slotDetailsLine}>
                    <div className={styles.slotDetailsLeft}>
                        <span className={styles.slotTimeText}>
                            <Moon size={14} strokeWidth={2.5} />
                            {slot.notify247 ? 'Сповіщати 24/7' : `з ${slot.dndStart}-${slot.dndEnd} не турбувати`}
                        </span>
                    </div>
                    <div className={styles.slotDetailsRight}>
                        <span className={styles.slotTimeText}>
                            за {slot.notifyAdvance} хв.
                            <Bell size={14} strokeWidth={2.5} />
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.cardSection}>
            <div className={styles.sectionTitle}>Налаштування сповіщень</div>
            
            {displaySlots.map((slot, index) => (
                <div 
                    key={slot.id} 
                    className={styles.solidCard} 
                    onClick={() => isLocked ? onRequireAuth?.() : onEditSlot?.(slot)} 
                    style={{ cursor: 'pointer' }}
                >
                    {renderSlotContent(slot, index)}
                </div>
            ))}
        </div>
    );
};
