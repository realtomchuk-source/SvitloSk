import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import { AppLogo } from '../../../components/ui/Icons/AppLogo';

interface AuthPromptSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

export const AuthPromptSheet: React.FC<AuthPromptSheetProps> = ({ isOpen, onClose, onLogin }) => {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Потрібна реєстрація">
            <div style={{ textAlign: 'center', padding: '32px 16px 120px' }}>
                
                {/* Branded Identity - Bulb */}
                <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ 
                        width: 72, 
                        height: 72, 
                        background: '#e4e4e7', 
                        borderRadius: '18px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <AppLogo size={50} />
                    </div>
                </div>

                <div style={{ 
                    fontSize: '17px', 
                    color: '#1a1a1c', 
                    marginBottom: '40px', 
                    lineHeight: '1.6', 
                    padding: '0 12px',
                    fontWeight: '600'
                }}>
                    Щоб користуватися цією функцією та синхронізувати дані, будь ласка, увійдіть у свій профіль.
                </div>

                <button 
                    onClick={() => {
                        onClose();
                        onLogin();
                    }} 
                    style={{
                        width: '100%',
                        background: '#ffffff',
                        color: '#1a1a1c',
                        border: '1px solid #e4e4e7',
                        borderRadius: '14px',
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Увійти через Google
                </button>
            </div>
        </BottomSheet>
    );
};
