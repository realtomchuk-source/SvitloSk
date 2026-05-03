import React from 'react';
import { LayoutGrid, Calendar } from 'lucide-react';
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

                {/* Стартова підчерга */}
                <div className={styles.settingItem} onClick={onChangeStartGroup}>
                    <div className={styles.settingLeft}>
                        <div className={styles.settingIconWrap}>
                            <LayoutGrid size={18} />
                        </div>
                        <span className={styles.settingLabel}>Стартова підчерга</span>
                    </div>
                    <div className={styles.settingRight}>
                        <span className={styles.settingValueOrange}>{config.startGroup}</span>
                        <span className={styles.settingChevron}>›</span>
                    </div>
                </div>

                {/* Графік на завтра */}
                <div 
                    className={styles.settingItem} 
                    onClick={isLocked ? onRequireAuth : onToggleTomorrow}
                >
                    <div className={styles.settingLeft}>
                        <div className={styles.settingIconWrap}>
                            <Calendar size={18} />
                        </div>
                        <span className={styles.settingLabel}>Графік на завтра</span>
                    </div>
                    <div
                        className={`${styles.toggle} ${config.tomorrowPush ? styles.toggleActive : ''}`}
                    />
                </div>

            </div>
        </div>
    );
};
