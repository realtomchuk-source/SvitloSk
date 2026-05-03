import React from 'react';
import type { Slot } from '@/schemas/user';
import styles from '../Cabinet.module.css';

interface NotificationSlotsProps {
    slots: Slot[];
    isLocked?: boolean;
    onRequireAuth?: () => void;
    onAddSlot?: () => void;
    onEditSlot?: (slot: Slot) => void;
}

export const NotificationSlots: React.FC<NotificationSlotsProps> = ({ slots, isLocked, onRequireAuth, onAddSlot, onEditSlot }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionTitle}>Налаштування сповіщень</div>
            
            {isLocked ? (
                <>
                    {[1, 2].map((i) => (
                        <div key={i} className={styles.solidCard} onClick={onRequireAuth} style={{ cursor: 'pointer' }}>
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
                        </div>
                    ))}
                </>
            ) : (
                <>
                    {slots.map(slot => (
                        <div key={slot.id} className={styles.solidCard} onClick={() => onEditSlot?.(slot)} style={{ cursor: 'pointer' }}>
                            <div className={styles.slotCard}>
                                <div className={styles.slotTopRow}>
                                    <div className={styles.slotTitleWrap}>
                                        <span className={styles.slotTitle}>{slot.locationName}</span>
                                        <span className={styles.slotTimeText}>за {slot.notifyTime} хв. до змін</span>
                                    </div>
                                    <div className={styles.slotGroup}>{slot.group}</div>
                                </div>
                                <div className={styles.slotBottomRow}>
                                    <span className={styles.slotDnd}>
                                        {slot.dndEnabled 
                                            ? 'Режим "Не турбувати" увімкнено' 
                                            : 'Сповіщати 24/7'}
                                    </span>
                                    <div className={slot.isActive ? styles.dotOrange : styles.dotGray}></div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button className={styles.addButton} onClick={onAddSlot}>
                        Додати сповіщення +
                    </button>
                </>
            )}
        </div>
    );
};
