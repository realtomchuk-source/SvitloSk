import React from 'react';
import { User } from 'lucide-react';
import { BrandIcon } from '../../../assets/brand/BrandIcon';
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
                    <div className={styles.avatarWrap} style={{ 
                        background: user.isAnon ? 'rgba(238, 114, 33, 0.08)' : '#f4f4f5', 
                        border: user.isAnon ? '1.5px solid #EE7221' : 'none',
                        boxShadow: 'none'
                    }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                            <div className={user.isAnon ? styles.brandIconWrap : ''} style={{ color: user.isAnon ? '#EE7221' : '#374151' }}>
                                {user.isAnon ? <BrandIcon variant="contour" size={48} /> : <User size={36} className={styles.avatarIcon} />}
                            </div>
                        )}
                    </div>
                    <div className={styles.profileText}>
                        <div className={styles.profileName} style={{ color: '#374151' }}>
                            {user.isAnon && user.id ? `Користувач #${user.id.slice(-4).toUpperCase()}` : user.name}
                        </div>
                        <div className={styles.profileSub} style={{ color: user.isAnon ? '#EE7221' : '#71717a', fontWeight: user.isAnon ? 600 : 400 }}>
                            {user.isAnon ? 'Натисніть, щоб авторизуватись' : user.status}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
