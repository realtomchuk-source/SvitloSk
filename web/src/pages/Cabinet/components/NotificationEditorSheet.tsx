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
    const [locationName, setLocationName] = useState('');
    const [group, setGroup] = useState('1.1');
    const [notifyTime, setNotifyTime] = useState(10);
    const [isActive, setIsActive] = useState(true);
    const [dndEnabled, setDndEnabled] = useState(false);

    useEffect(() => {
        if (isOpen && slot) {
            setLocationName(slot.locationName);
            setGroup(slot.group);
            setNotifyTime(slot.notifyTime);
            setIsActive(slot.isActive);
            setDndEnabled(slot.dndEnabled);
        } else if (isOpen && !slot) {
            setLocationName('');
            setGroup('1.1');
            setNotifyTime(10);
            setIsActive(true);
            setDndEnabled(false);
        }
    }, [isOpen, slot]);

    const handleSave = () => {
        const updatedSlot: Slot = {
            id: slot?.id || crypto.randomUUID(),
            locationName: locationName || 'Нова локація',
            group: group,
            notifyTime: notifyTime,
            isActive: isActive,
            dndEnabled: dndEnabled
        };
        onSave(updatedSlot);
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Налаштування сповіщень">
            <div style={{ padding: '0 16px 120px' }}>
            <div className={styles.formGroup}>
                <div className={styles.label}>Як назвемо локацію?</div>
                <input 
                    className={styles.input} 
                    value={locationName} 
                    onChange={e => setLocationName(e.target.value)} 
                    placeholder="Наприклад: Дім" 
                />
                <div className={styles.chips}>
                    {PRESET_LOCATIONS.map(loc => (
                        <button key={loc} className={styles.chip} onClick={() => setLocationName(loc)}>
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
                            className={`${styles.gridBtn} ${group === g ? styles.gridBtnSelected : ''}`}
                            onClick={() => setGroup(g)}
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
                        value={notifyTime}
                        onChange={e => setNotifyTime(Number(e.target.value))}
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
                    <div className={styles.dndLabel}>Активувати сповіщення</div>
                    <div 
                        style={{
                            width: 44, height: 24, borderRadius: 12, 
                            background: isActive ? '#10b981' : '#e4e4e7',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onClick={() => setIsActive(!isActive)}
                    >
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: isActive ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>

                <div className={styles.dndRow} style={{ marginTop: 12 }}>
                    <div className={styles.dndLabel}>Режим "Не турбувати"</div>
                    <div 
                        style={{
                            width: 44, height: 24, borderRadius: 12, 
                            background: dndEnabled ? '#f97316' : '#e4e4e7',
                            position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onClick={() => setDndEnabled(!dndEnabled)}
                    >
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: dndEnabled ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </div>
                </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
                Зберегти
            </button>
            
            {slot && (
                <button className={styles.deleteBtn} onClick={() => {
                    onDelete(slot.id);
                    onClose();
                }}>
                    Видалити локацію
                </button>
            )}
            </div>
        </BottomSheet>
    );
};
