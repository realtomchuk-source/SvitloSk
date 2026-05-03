import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import type { Slot } from '../../../../schemas/user';
import styles from './NotificationEditorSheet.module.css';

interface NotificationEditorSheetProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot | null;
    onSave: (slot: Slot) => void;
    onDelete: (id: string) => void;
}

const PRESET_LOCATIONS = ['Дім', 'Робота', 'Офіс'];
const GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];

const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
};

export const NotificationEditorSheet: React.FC<NotificationEditorSheetProps> = ({
    isOpen,
    onClose,
    slot,
    onSave,
    onDelete
}) => {
    const [name, setName] = useState('');
    const [subgroup, setSubgroup] = useState('1.1');
    const [advanceMinutes, setAdvanceMinutes] = useState(10);
    const [dndActive, setDndActive] = useState(false); // Inverse of "24/7"
    const [startHour, setStartHour] = useState(22);
    const [endHour, setEndHour] = useState(8);

    useEffect(() => {
        if (isOpen && slot) {
            setName(slot.name);
            setSubgroup(slot.group);
            setAdvanceMinutes(slot.settings.advanceMinutes);
            setDndActive(slot.settings.dnd?.active || false);
            if (slot.settings.dnd?.active) {
                setStartHour(parseInt(slot.settings.dnd.start.split(':')[0]));
                setEndHour(parseInt(slot.settings.dnd.end.split(':')[0]));
            }
        } else if (isOpen && !slot) {
            // Default new slot
            setName('');
            setSubgroup('1.1');
            setAdvanceMinutes(10);
            setDndActive(true);
            setStartHour(22);
            setEndHour(8);
        }
    }, [isOpen, slot]);

    const handleSave = () => {
        const updatedSlot: Slot = {
            id: slot?.id || Date.now().toString(),
            name: name || 'Нова локація',
            group: subgroup,
            settings: {
                advanceMinutes,
                pushEnabled: true,
                dnd: {
                    active: dndActive,
                    start: formatHour(startHour),
                    end: formatHour(endHour)
                }
            }
        };
        onSave(updatedSlot);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Налаштування пуш">
            
            <div className={styles.formGroup}>
                <div className={styles.label}>Як назвемо локацію?</div>
                <input 
                    className={styles.input} 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Наприклад: Дім" 
                />
                <div className={styles.chips}>
                    {PRESET_LOCATIONS.map(loc => (
                        <button key={loc} className={styles.chip} onClick={() => setName(loc)}>
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.formGroup}>
                <div className={styles.label}>Оберіть підчергу</div>
                <div className={styles.grid}>
                    {GROUPS.map(g => (
                        <button
                            key={g}
                            className={`${styles.gridBtn} ${subgroup === g ? styles.gridBtnSelected : ''}`}
                            onClick={() => setSubgroup(g)}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.formGroup}>
                <div className={styles.label}>Попередити за</div>
                <div className={styles.selectWrap}>
                    <select 
                        className={styles.select} 
                        value={advanceMinutes}
                        onChange={e => setAdvanceMinutes(Number(e.target.value))}
                    >
                        <option value={5}>5 хв</option>
                        <option value={10}>10 хв</option>
                        <option value={15}>15 хв</option>
                        <option value={30}>30 хв</option>
                    </select>
                    <ChevronDown className={styles.selectIcon} size={18} />
                </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: 16 }}>
                <div className={styles.dndRow}>
                    <div className={styles.dndLabel}>Сповіщати 24/7</div>
                    {/* Fake toggle switch using standard HTML checkbox styled or just a simple button. 
                        For true UX, let's use a nice custom toggle */}
                    <div 
                        style={{
                            width: 44, height: 24, borderRadius: 12, 
                            background: !dndActive ? '#10b981' : '#e4e4e7',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onClick={() => setDndActive(!dndActive)}
                    >
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: !dndActive ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>

                {dndActive && (
                    <>
                        <div className={styles.timeSliderRow}>
                            <div className={styles.timeLabel}>Початок</div>
                            <input 
                                type="range" min="0" max="23" 
                                value={startHour} 
                                onChange={e => setStartHour(Number(e.target.value))}
                                className={styles.timeInput} 
                            />
                            <div className={styles.timeValue}>{formatHour(startHour)}</div>
                        </div>
                        <div className={styles.timeSliderRow}>
                            <div className={styles.timeLabel}>Кінець</div>
                            <input 
                                type="range" min="0" max="23" 
                                value={endHour} 
                                onChange={e => setEndHour(Number(e.target.value))}
                                className={styles.timeInput} 
                            />
                            <div className={styles.timeValue}>{formatHour(endHour)}</div>
                        </div>
                    </>
                )}
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
                Зберегти
            </button>
            
            {slot && (
                <button className={styles.deleteBtn} onClick={() => {
                    onDelete(slot.id);
                    onClose();
                }}>
                    Вимкнути локацію
                </button>
            )}

        </BottomSheet>
    );
};
