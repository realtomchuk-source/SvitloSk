import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import styles from './HourPickerSheet.module.css';

interface HourPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedHour: number;
    onSelectHour: (hour: number) => void;
    title: string;
}

export const HourPickerSheet: React.FC<HourPickerSheetProps> = ({ 
    isOpen, 
    onClose, 
    selectedHour, 
    onSelectHour,
    title
}) => {


    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ padding: '16px 16px 120px' }}>
                <div className={styles.grid}>
                    {Array.from({ length: 24 }).map((_, hour) => (
                        <button
                            key={hour}
                            type="button"
                            className={`${styles.hourBtn} ${selectedHour === hour ? styles.hourBtnActive : ''}`}
                            onClick={() => {
                                onSelectHour(hour);
                                onClose();
                            }}
                        >
                            {hour.toString().padStart(2, '0')}:00
                        </button>
                    ))}
                </div>
            </div>
        </BottomSheet>
    );
};
