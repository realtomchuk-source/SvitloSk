import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import styles from '../Cabinet.module.css';

interface SignOutSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
}

export const SignOutSheet: React.FC<SignOutSheetProps> = ({ isOpen, onClose, onConfirm, userName }) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Вийти з акаунту?">
            <div style={{ padding: '0 0 24px' }}>

                <p style={{ fontSize: '15px', color: '#71717a', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Ви виходите з акаунту{' '}
                    <span style={{ color: '#1a1a1c', fontWeight: 700 }}>{userName}</span>.
                    {' '}Локальні дані буде скинуто.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        className={styles.signOutConfirmBtn}
                        onClick={handleConfirm}
                    >
                        Вийти
                    </button>
                    <button
                        className={styles.signOutCancelBtn}
                        onClick={onClose}
                    >
                        Залишитись
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
};
