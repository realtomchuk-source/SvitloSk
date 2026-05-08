import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { MainLogoIcon } from '../../../assets/brand/MainLogoIcon';
import styles from './AboutSheet.module.css';

interface AboutSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutSheet: React.FC<AboutSheetProps> = ({ isOpen, onClose }) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Про застосунок">
            <div className={styles.container}>
                <div className={styles.logoBoxWrap}>
                    <div className={styles.logoBox}>
                        <MainLogoIcon size={84} />
                    </div>
                </div>
                
                <h2 className={styles.title}>
                    <span style={{ color: '#ee7221' }}>Svitlo</span>
                    <span style={{ color: '#374151' }}>Sk</span>
                </h2>
                <p className={styles.version}>
                    Версія 2.1.0
                </p>

                <div className={styles.descriptionBox}>
                    <p className={styles.descriptionText}>
                        Зручний інструмент моніторингу енергопостачання Старокостянтинівської громади.
                    </p>
                    <p className={styles.descriptionText} style={{ marginTop: '12px' }}>
                        Ми робимо отримання інформації комфортним та швидким.
                    </p>
                </div>

                <div className={styles.footer}>
                    <p>Розроблено з любов'ю до громади ❤️</p>
                    <p>© 2026 SvitloSk Team</p>
                </div>
            </div>
        </BottomSheet>
    );
};
