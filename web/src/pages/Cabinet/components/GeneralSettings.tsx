import React from 'react';
import { LayoutGrid, Calendar, ChevronRight } from 'lucide-react';
import { CabinetRow } from './CabinetPrimitives';
import styles from '../Cabinet.module.css';

interface GeneralSettingsProps {
    config: {
        startGroup: string;
        tomorrowPush: boolean;
    };
    isLocked?: boolean;
    onToggleTomorrow: () => void;
    onChangeStartGroup: () => void;
    onRequireAuth?: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    config,
    isLocked,
    onToggleTomorrow,
    onChangeStartGroup,
    onRequireAuth
}) => {
    return (
        <div className={styles.section}>
            <div className={styles.solidCard}>
                <CabinetRow
                    icon={<LayoutGrid size={18} strokeWidth={2.5} />}
                    label="Стартова підчерга"
                    onClick={onChangeStartGroup}
                    rightElement={
                        <>
                            <span className={styles.settingValueOrange}>{config.startGroup}</span>
                            <ChevronRight size={16} color="#d4d4d8" />
                        </>
                    }
                />

                <CabinetRow
                    icon={<Calendar size={18} strokeWidth={2.5} />}
                    label="Графік на завтра"
                    onClick={isLocked ? onRequireAuth : onToggleTomorrow}
                    rightElement={
                        <div
                            className={`${styles.toggle} ${config.tomorrowPush ? styles.toggleActive : ''}`}
                            style={{ background: config.tomorrowPush ? '#EE7221' : '#374151' }}
                        />
                    }
                />
            </div>
        </div>
    );
};
