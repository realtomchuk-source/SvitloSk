import React from 'react';
import styles from '../Cabinet.module.css';

interface CabinetIconBoxProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Standardized 32px icon box with 1px orange border and 8px radius.
 */
export const CabinetIconBox: React.FC<CabinetIconBoxProps> = ({ children, className }) => {
    return (
        <div className={`${styles.iconBox} ${className || ''}`}>
            {children}
        </div>
    );
};

interface CabinetRowProps {
    icon?: React.ReactNode;
    label: React.ReactNode;
    rightElement?: React.ReactNode;
    onClick?: () => void;
    className?: string;
    showPhantomGap?: boolean;
}

/**
 * A unified row component that enforces the 'Iron Vertical' alignment.
 * If 'icon' is missing but 'showPhantomGap' is true, it reserves space for alignment.
 */
export const CabinetRow: React.FC<CabinetRowProps> = ({ 
    icon, 
    label, 
    rightElement, 
    onClick, 
    className,
    showPhantomGap = false
}) => {
    return (
        <div className={`${styles.cabinetRow} ${className || ''}`} onClick={onClick}>
            <div className={styles.rowLeft}>
                {icon ? (
                    <CabinetIconBox>{icon}</CabinetIconBox>
                ) : (
                    showPhantomGap && <div style={{ width: 'var(--cb-icon-box-size)' }} />
                )}
                <div className={styles.rowLabel}>{label}</div>
            </div>
            {rightElement && <div className={styles.rowRight}>{rightElement}</div>}
        </div>
    );
};
