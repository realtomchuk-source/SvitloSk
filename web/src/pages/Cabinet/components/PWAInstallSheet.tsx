import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { Share, PlusSquare, Download } from 'lucide-react';
import styles from '../Cabinet.module.css';

interface PWAInstallSheetProps {
    isOpen: boolean;
    onClose: () => void;
    isIOS: boolean;
    onInstall: () => Promise<boolean>;
}

export const PWAInstallSheet: React.FC<PWAInstallSheetProps> = ({
    isOpen,
    onClose,
    isIOS,
    onInstall
}) => {
    const handleInstallClick = async () => {
        const success = await onInstall();
        if (success) {
            onClose();
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Встановити SvitloSk">
            <div style={{ padding: '0 8px 16px' }}>
                {isIOS ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <p style={{ fontSize: '15px', color: '#52525b', margin: '0 0 8px', lineHeight: 1.5, textAlign: 'center' }}>
                            Встановіть SvitloSk на свій iPhone або iPad для зручного доступу безпосередньо з робочого столу:
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(238, 114, 33, 0.08)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#EE7221',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    flexShrink: 0
                                }}>
                                    1
                                </div>
                                <div style={{ fontSize: '14px', color: '#1a1a1c', lineHeight: 1.4 }}>
                                    Натисніть кнопку <strong>«Поділитися»</strong> <Share size={16} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle', color: '#007AFF' }} /> в нижньому меню браузера Safari.
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(238, 114, 33, 0.08)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#EE7221',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    flexShrink: 0
                                }}>
                                    2
                                </div>
                                <div style={{ fontSize: '14px', color: '#1a1a1c', lineHeight: 1.4 }}>
                                    Прокрутіть меню вниз та оберіть <strong>«Додати на початковий екран»</strong> <PlusSquare size={16} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }} />.
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(238, 114, 33, 0.08)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#EE7221',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    flexShrink: 0
                                }}>
                                    3
                                </div>
                                <div style={{ fontSize: '14px', color: '#1a1a1c', lineHeight: 1.4 }}>
                                    Натисніть кнопку <strong>«Додати»</strong> у правому верхньому кутку екрана.
                                </div>
                            </div>
                        </div>

                        <button
                            className={styles.signOutCancelBtn}
                            onClick={onClose}
                            style={{ marginTop: '10px' }}
                        >
                            Зрозуміло
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ 
                                width: '56px', 
                                height: '56px', 
                                borderRadius: '50%', 
                                background: 'rgba(238, 114, 33, 0.08)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#EE7221',
                                margin: '0 auto 12px'
                            }}>
                                <Download size={28} />
                            </div>
                            <p style={{ fontSize: '15px', color: '#52525b', margin: '0', lineHeight: 1.5 }}>
                                Встановіть SvitloSk на свій пристрій, щоб швидко переглядати графіки та отримувати сповіщення безпосередньо з робочого столу.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                className={styles.signOutConfirmBtn}
                                onClick={handleInstallClick}
                                style={{ background: '#EE7221', color: '#ffffff' }}
                            >
                                Встановити
                            </button>
                            <button
                                className={styles.signOutCancelBtn}
                                onClick={onClose}
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </BottomSheet>
    );
};
