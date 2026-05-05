import React from 'react';
import styles from './SubgroupGrid.module.css';

const GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];

interface SubgroupGridProps {
    selectedGroup: string;
    onSelect: (group: string) => void;
}

export const SubgroupGrid: React.FC<SubgroupGridProps> = ({ selectedGroup, onSelect }) => {
    return (
        <div className={styles.grid}>
            {GROUPS.map(group => (
                <button
                    key={group}
                    className={`${styles.groupBtn} ${selectedGroup === group ? styles.groupBtnActive : ''}`}
                    onClick={() => onSelect(group)}
                >
                    {group}
                </button>
            ))}
        </div>
    );
};
