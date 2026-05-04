import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import type { Slot } from '@/schemas/user';
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

export const NotificationEditorSheet: React.FC<NotificationEditorSheetProps> = ({
    isOpen,
    onClose,
    slot,
    onSave,
    onDelete
}) => {
    const [name, setName] = useState('');
    const [subGroup, setSubGroup] = useState('');
    const [notifyAdvance, setNotifyAdvance] = useState(10);
    const [notify247, setNotify247] = useState(true);
    const [dndStart, setDndStart] = useState('22:00');
    const [dndEnd, setDndEnd] = useState('08:00');

    useEffect(() => {
        if (isOpen && slot) {
            setName(slot.name);
            setSubGroup(slot.subGroup);
            setNotifyAdvance(slot.notifyAdvance);
            setNotify247(slot.notify247);
            setDndStart(slot.dndStart);
            setDndEnd(slot.dndEnd);
        }
    }, [isOpen, slot]);

    const handleSave = () => {
        if (!slot) return;
        const updatedSlot: Slot = {
            ...slot,
            name: name || 'Локація',
            subGroup: subGroup || '1.1',
            notifyAdvance,
            notify247,
            dndStart,
            dndEnd,
            isActive: true
        };
        onSave(updatedSlot);
        onClose();
    };

    const formatHour = (timeStr: string) => parseInt(timeStr.split(':')[0]);
    
    const updateHour = (setter: (val: string) => void, hour: number) => {
        const formatted = `${hour.toString().padStart(2, '0')}:00`;
        setter(formatted);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Налаштування пуш">
            <div style={{ padding: '0 16px 120px' }}>
                <div className={styles.formGroup}>
                    <div className={styles.label}>Як назвемо локацію?</div>
                    <input 
                        className={styles.input} 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Дім" 
                    />
                    <div className={styles.chips}>
                        {PRESET_LOCATIONS.map(tag => (
                            <button key={tag} className={styles.chip} onClick={() => setName(tag)}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.subgroupLabel}>Оберіть підчергу</div>
                    <div className={styles.grid}>
                        {GROUPS.map(g => (
                            <button
                                key={g}
                                className={`${styles.gridBtn} ${subGroup === g ? styles.gridBtnSelected : ''}`}
                                onClick={() => setSubGroup(g)}
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
                            value={notifyAdvance}
                            onChange={e => setNotifyAdvance(Number(e.target.value))}
                        >
                            <option value={5}>5 хв</option>
                            <option value={10}>10 хв</option>
                            <option value={15}>15 хв</option>
                        </select>
                        <ChevronDown className={styles.selectIcon} size={18} />
                    </div>
                </div>

                <div className={styles.toggleRow}>
                    <div className={styles.toggleLabel}>Сповіщати 24/7</div>
                    <div 
                        style={{
                            width: 44, height: 24, borderRadius: 12, 
                            background: notify247 ? '#f97316' : '#9ca3af',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onClick={() => setNotify247(!notify247)}
                    >
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: notify247 ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>

                <div className={styles.sliderContainer}>
                    <div className={styles.sliderRow}>
                        <div className={styles.sliderLabel}>Початок</div>
                        <input 
                            type="range" 
                            min="0" max="23" 
                            value={formatHour(dndStart)}
                            disabled={notify247}
                            onChange={e => updateHour(setDndStart, parseInt(e.target.value))}
                            className={styles.rangeInput}
                        />
                        <div className={`${styles.timeDisplay} ${notify247 ? styles.timeDisplayDisabled : ''}`}>
                            {dndStart}
                        </div>
                    </div>

                    <div className={styles.sliderRow}>
                        <div className={styles.sliderLabel}>Кінець</div>
                        <input 
                            type="range" 
                            min="0" max="23" 
                            value={formatHour(dndEnd)}
                            disabled={notify247}
                            onChange={e => updateHour(setDndEnd, parseInt(e.target.value))}
                            className={styles.rangeInput}
                        />
                        <div className={`${styles.timeDisplay} ${notify247 ? styles.timeDisplayDisabled : ''}`}>
                            {dndEnd}
                        </div>
                    </div>
                </div>

                <button className={styles.saveBtn} onClick={handleSave}>
                    Зберегти
                </button>
                
                {slot && (
                    <button className={styles.deleteLink} onClick={() => {
                        onDelete(slot.id);
                        onClose();
                    }}>
                        Вимкнути локацію
                    </button>
                )}
            </div>
        </BottomSheet>
    );
};
