import React from 'react';
import { CabinetRow } from './CabinetPrimitives';
import styles from '../Cabinet.module.css';

interface GeneralSettingsProps {
    config: {
        startGroup: string;
        tomorrowPush: boolean;
    };
    isLocked?: boolean;
    onToggleTomorrow: () => void;
    onRequireAuth?: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    config,
    isLocked,
    onToggleTomorrow,
    onRequireAuth
}) => {
    return (
        <div className={`${styles.section} ${styles.generalSettingsSection}`}>
            <div className={styles.solidCard}>

                <CabinetRow
                    label={<span className={styles.slotTitle}>Графік на завтра</span>}
                    onClick={isLocked ? onRequireAuth : onToggleTomorrow}
                    className={styles.controlPanelRow}
                    rightElement={
                        <div className={`${styles.toggle} ${config.tomorrowPush ? styles.toggleActive : ''}`} />
                    }
                />
            </div>
        </div>
    );
};
