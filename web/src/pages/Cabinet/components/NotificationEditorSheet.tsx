import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { HourPickerSheet } from './HourPickerSheet';
import { SubgroupGrid } from '../../../components/ui/SubgroupGrid/SubgroupGrid';
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
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

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
                    <SubgroupGrid 
                        selectedGroup={subGroup} 
                        onSelect={setSubGroup} 
                    />
                </div>

                <div className={styles.formGroup}>
                    <div className={styles.label}>Попередити за</div>
                    <div className={styles.segmentedControl}>
                        {[5, 10, 15].map(mins => (
                            <button
                                key={mins}
                                className={`${styles.segmentedOption} ${notifyAdvance === mins ? styles.segmentedActive : ''}`}
                                onClick={() => setNotifyAdvance(mins)}
                            >
                                {mins} хв
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.toggleRow}>
                    <div className={styles.toggleLabel}>Сповіщати 24/7</div>
                    <div 
                        className={`${styles.toggleSwitch} ${notify247 ? styles.toggleActive : ''}`}
                        onClick={() => setNotify247(!notify247)}
                    >
                        <div className={styles.toggleThumb} />
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
                        <div 
                            className={`${styles.timeDisplay} ${notify247 ? styles.timeDisplayDisabled : ''}`}
                            onClick={() => !notify247 && setIsStartPickerOpen(true)}
                            style={{ cursor: notify247 ? 'default' : 'pointer' }}
                        >
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
                        <div 
                            className={`${styles.timeDisplay} ${notify247 ? styles.timeDisplayDisabled : ''}`}
                            onClick={() => !notify247 && setIsEndPickerOpen(true)}
                            style={{ cursor: notify247 ? 'default' : 'pointer' }}
                        >
                            {dndEnd}
                        </div>
                    </div>
                </div>

                <HourPickerSheet 
                    isOpen={isStartPickerOpen}
                    onClose={() => setIsStartPickerOpen(false)}
                    selectedHour={formatHour(dndStart)}
                    onSelectHour={(h) => updateHour(setDndStart, h)}
                    title="Час початку"
                />

                <HourPickerSheet 
                    isOpen={isEndPickerOpen}
                    onClose={() => setIsEndPickerOpen(false)}
                    selectedHour={formatHour(dndEnd)}
                    onSelectHour={(h) => updateHour(setDndEnd, h)}
                    title="Час закінчення"
                />

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
