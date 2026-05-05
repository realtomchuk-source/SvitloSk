import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { BrandIcon } from '../../../assets/brand/BrandIcon';
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
                        <BrandIcon variant="logo" size={48} color="#EE7221" />
                    </div>
                </div>
                
                <h2 className={styles.title}>
                    SvitloSk
                </h2>
                <p className={styles.version}>
                    Версія 2.1.0 (Build 20240503)
                </p>

                <div className={styles.descriptionBox}>
                    <p className={styles.descriptionText}>
                        <strong>SvitloSk</strong> — це зручний інструмент для моніторингу графіків відключень світла у Старокостянтинівській громаді. 
                        Ми прагнемо робити отримання інформації швидким та комфортним.
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
