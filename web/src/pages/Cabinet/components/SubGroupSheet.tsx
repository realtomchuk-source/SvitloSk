import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import styles from './SubGroupSheet.module.css';

interface SubGroupSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroup: string;
    onSelectGroup: (group: string) => void;
}

const GROUPS = [
    '1.1', '1.2', '2.1', '2.2', 
    '3.1', '3.2', '4.1', '4.2', 
    '5.1', '5.2', '6.1', '6.2'
];

export const SubGroupSheet: React.FC<SubGroupSheetProps> = ({ 
    isOpen, 
    onClose, 
    selectedGroup, 
    onSelectGroup 
}) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Оберіть підчергу">
            <div className={styles.grid}>
                {GROUPS.map(group => (
                    <button
                        key={group}
                        className={`${styles.button} ${selectedGroup === group ? styles.buttonSelected : ''}`}
                        onClick={() => {
                            onSelectGroup(group);
                            onClose();
                        }}
                    >
                        {group}
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
};
