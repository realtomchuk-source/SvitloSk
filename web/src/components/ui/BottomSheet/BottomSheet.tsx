import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
    const [render, setRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Wait for animation to finish before removing from DOM
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div 
            className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className={`${styles.sheet} ${isOpen ? styles.sheetVisible : ''}`}>
                <div className={styles.dragHandleWrap}>
                    <div className={styles.dragHandle} />
                </div>
                
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={onClose} aria-label="Go back">
                        <ArrowLeft size={18} />
                    </button>
                    <div className={styles.title}>{title}</div>
                </div>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};
