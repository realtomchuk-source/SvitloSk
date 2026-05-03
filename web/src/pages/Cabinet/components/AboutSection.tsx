import React from 'react';
import { Info, Share2, MessageSquare } from 'lucide-react';
import styles from '../Cabinet.module.css';

interface AboutSectionProps {
    onShare: () => void;
    onFeedback: () => void;
    onAbout: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onShare, onFeedback, onAbout }) => {
    return (
        <div className={styles.section}>
            <div className={styles.aboutList}>

                {/* Про застосунок */}
                <div className={styles.infoItem} onClick={onAbout}>
                    <div className={styles.infoLeft}>
                        <Info size={18} />
                        <span className={styles.infoLabel}>Про застосунок</span>
                    </div>
                    <span className={styles.infoChevron}>›</span>
                </div>

                {/* Поділитись */}
                <div className={styles.infoItem} onClick={onShare}>
                    <div className={styles.infoLeft}>
                        <Share2 size={18} />
                        <span className={styles.infoLabel}>Поділитись</span>
                    </div>
                    <span className={styles.infoChevron}>›</span>
                </div>

                {/* Зворотній зв'язок */}
                <div className={styles.infoItem} onClick={onFeedback}>
                    <div className={styles.infoLeft}>
                        <MessageSquare size={18} />
                        <span className={styles.infoLabel}>Зворотній зв'язок</span>
                    </div>
                    <span className={styles.infoChevron}>›</span>
                </div>

            </div>
        </div>
    );
};
