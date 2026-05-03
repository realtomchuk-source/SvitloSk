import React from 'react';
import { User } from 'lucide-react';
import { AppLogo } from '../../../components/ui/Icons/AppLogo';
import styles from '../Cabinet.module.css';

interface ProfileCardProps {
    user: {
        name: string;
        status: string;
        avatarUrl?: string;
        id?: string;
        isAnon?: boolean;
    };
    onClick?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClick }) => {
    return (
        <div className={styles.section} onClick={user.isAnon ? onClick : undefined} style={{ cursor: user.isAnon ? 'pointer' : 'default' }}>
            <div className={styles.solidCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarWrap} style={{ background: user.isAnon ? '#e4e4e7' : 'transparent' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                            <div className={user.isAnon ? styles.brandIconWrap : ''} style={{ color: user.isAnon ? '#ffffff' : 'inherit' }}>
                                {user.isAnon ? <AppLogo size={34} /> : <User size={24} className={styles.avatarIcon} />}
                            </div>
                        )}
                    </div>
                    <div className={styles.profileText}>
                        <div className={styles.profileName}>
                            {user.isAnon && user.id ? `Користувач #${user.id.slice(-4).toUpperCase()}` : user.name}
                        </div>
                        <div className={styles.profileSub} style={{ color: user.isAnon ? '#f97316' : '#71717a', fontWeight: user.isAnon ? 600 : 400 }}>
                            {user.isAnon ? 'Натисніть, щоб авторизуватись' : user.status}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
