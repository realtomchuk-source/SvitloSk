import React from 'react';
import type { Slot } from '@/schemas/user';
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

    const renderSlotContent = (slot: Slot) => {
        const isNotConfigured = !slot.name || !slot.subGroup;

        if (isNotConfigured) {
            return (
                <div className={styles.slotCard}>
                    <div className={styles.slotTopRow}>
                        <div className={styles.slotTitleWrap}>
                            <span className={styles.slotTitle} style={{ color: '#a1a1aa' }}>Локація не налаштована</span>
                        </div>
                    </div>
                    <div className={styles.slotBottomRow}>
                        <span className={styles.slotDnd} style={{ color: '#a1a1aa' }}>Натисніть для налаштування</span>
                        <div className={styles.dotGray}></div>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.slotCard}>
                <div className={styles.slotTopRow}>
                    <div className={styles.slotTitleWrap}>
                        <span className={styles.slotTitle}>{slot.name}</span>
                        <span className={styles.slotTimeText}>за {slot.notifyAdvance} хв. до змін</span>
                    </div>
                    <div className={styles.slotGroup}>{slot.subGroup}</div>
                </div>
                <div className={styles.slotBottomRow}>
                    <span className={styles.slotDnd}>
                        {slot.notify247 
                            ? 'Сповіщати 24/7' 
                            : `Не турбувати ${slot.dndStart}-${slot.dndEnd}`}
                    </span>
                    <div className={slot.isActive ? styles.dotOrange : styles.dotGray}></div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionTitle}>Налаштування сповіщень</div>
            
            {displaySlots.map(slot => (
                <div 
                    key={slot.id} 
                    className={styles.solidCard} 
                    onClick={() => isLocked ? onRequireAuth?.() : onEditSlot?.(slot)} 
                    style={{ cursor: 'pointer' }}
                >
                    {renderSlotContent(slot)}
                </div>
            ))}
        </div>
    );
};
