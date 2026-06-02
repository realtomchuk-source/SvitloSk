import React from 'react';
import { BrandIcon } from '../../../assets/brand/BrandIcon';
import styles from '../Cabinet.module.css';

// ── SVG Icons ──────────────────────────────────────────────────────────────────

const GoogleIcon: React.FC<{ active: boolean }> = ({ active }) =>
    active ? (
        // Full-color Google G
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    ) : (
        // Grayscale Google G
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#d4d4d8" />
        </svg>
    );

const TelegramIcon: React.FC = () => (
    // Always grayscale — future integration
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.938z" fill="#d4d4d8" />
    </svg>
);


// ── Component ──────────────────────────────────────────────────────────────────

interface ProfileCardProps {
    user: {
        name: string;
        avatarUrl?: string;
        id?: string;
        isAnon?: boolean;
    };
    onClick?: () => void;       // anon → open auth sheet
    onSignOut?: () => void;     // registered → open sign-out sheet
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClick, onSignOut }) => {
    const isAnon = !!user.isAnon;

    return (
        <div
            className={styles.section}
            onClick={isAnon ? onClick : undefined}
            style={{ cursor: isAnon ? 'pointer' : 'default' }}
        >
            <div className={isAnon ? styles.profileCardGuest : styles.profileCardReg}>
                <div className={styles.profileHeader}>

                    {/* Avatar / Brand icon */}
                    <div className={isAnon ? styles.brandIconWrap : styles.avatarWrap}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                            isAnon
                                ? <div className={styles.brandIconInner}><BrandIcon variant="solid" size={42} /></div>
                                : <span style={{ fontSize: '22px' }}>👤</span>
                        )}
                    </div>

                    {/* Name block */}
                    <div className={styles.profileText}>
                        <div className={styles.profileName}>
                            {isAnon && user.id
                                ? `Користувач #${user.id.slice(-4).toUpperCase()}`
                                : user.name}
                        </div>
                    </div>

                    {/* Action Grid — top right (stacked vertically: Google on top, Telegram below) */}
                    <div className={styles.profileActionsGrid} style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridTemplateColumns: 'none' }}>
                        {/* Google Icon (Top, where the lightbulb was) */}
                        <button
                            className={styles.syncIconBtn}
                            onClick={!isAnon ? (e) => { e.stopPropagation(); onSignOut?.(); } : undefined}
                            style={{ cursor: !isAnon ? 'pointer' : 'default' }}
                            title={!isAnon ? 'Вийти з акаунту Google' : 'Google'}
                        >
                            <GoogleIcon active={!isAnon} />
                        </button>

                        {/* Telegram Icon (below Google) */}
                        <div className={styles.syncIconBtn} title="Telegram (незабаром)">
                            <TelegramIcon />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
