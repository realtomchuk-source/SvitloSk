import React from 'react';
import { Info, Share2, MessageSquare, ChevronRight } from 'lucide-react';
import { CabinetRow } from './CabinetPrimitives';
import styles from '../Cabinet.module.css';

interface AboutSectionProps {
    onShare: () => void;
    onFeedback: () => void;
    onAbout: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onShare, onFeedback, onAbout }) => {
    return (
        <div className={styles.section}>
            <div className={styles.solidCard}>
                <CabinetRow
                    icon={<Info size={18} strokeWidth={2.5} />}
                    label="Про застосунок"
                    onClick={onAbout}
                    rightElement={<ChevronRight size={16} color="#d4d4d8" />}
                />

                <CabinetRow
                    icon={<Share2 size={18} strokeWidth={2.5} />}
                    label="Поділитись"
                    onClick={onShare}
                    rightElement={<ChevronRight size={16} color="#d4d4d8" />}
                />

                <CabinetRow
                    icon={<MessageSquare size={18} strokeWidth={2.5} />}
                    label="Зворотній зв'язок"
                    onClick={onFeedback}
                    rightElement={<ChevronRight size={16} color="#d4d4d8" />}
                />
            </div>
        </div>
    );
};
