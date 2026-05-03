import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { AppLogo } from '../../../components/ui/Icons/AppLogo';

interface AboutSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutSheet: React.FC<AboutSheetProps> = ({ isOpen, onClose }) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Про застосунок">
            <div style={{ textAlign: 'center', padding: '24px 16px 120px' }}>
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ 
                        width: 80, 
                        height: 80, 
                        background: '#e4e4e7', 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <AppLogo size={60} />
                    </div>
                </div>
                
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1a1a1c' }}>
                    SvitloSk
                </h2>
                <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>
                    Версія 2.1.0 (Build 20240503)
                </p>

                <div style={{ textAlign: 'left', background: '#f4f4f5', borderRadius: '16px', padding: '16px', marginBottom: 24 }}>
                    <p style={{ fontSize: 14, color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>
                        <strong>SvitloSk</strong> — це зручний інструмент для моніторингу графіків відключень світла у Старокостянтинові. 
                        Ми прагнемо зробити отримання інформації максимально швидким та комфортним.
                    </p>
                </div>

                <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                    <p style={{ marginBottom: 4 }}>Розроблено з любов'ю до міста ❤️</p>
                    <p>© 2024 SvitloSk Team</p>
                </div>
            </div>
        </BottomSheet>
    );
};
