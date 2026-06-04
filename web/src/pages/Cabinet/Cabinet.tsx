import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ProfileCard } from './components/ProfileCard';
import { NotificationSlots } from './components/NotificationSlots';
import { GeneralSettings } from './components/GeneralSettings';
import { CabinetRow } from './components/CabinetPrimitives';
// Icons handled in primitives or sub-components
import { AboutSection } from './components/AboutSection';
import { SubGroupSheet } from './components/SubGroupSheet';
import { NotificationEditorSheet } from './components/NotificationEditorSheet';
import { AuthPromptSheet } from './components/AuthPromptSheet';
import { AboutSheet } from './components/AboutSheet';
import { SignOutSheet } from './components/SignOutSheet';
import type { Slot } from '@/schemas/user';
import { clsx } from 'clsx';
import styles from './Cabinet.module.css';
import { subscribeToPushNotifications } from '@/pushService';
import { supabase } from '@/services/supabaseClient';
import { usePWA } from '@/hooks/usePWA';
import { PWAInstallSheet } from './components/PWAInstallSheet';
import { Download } from 'lucide-react';

export const Cabinet: React.FC = () => {
    const { user, userConfig, updateUserConfig, slots, addSlot, updateSlot, deleteSlot, signInWithGoogle, signOut } = useStore();
    const location = useLocation();

    const [isSubGroupSheetOpen, setSubGroupSheetOpen] = useState(false);
    const [isEditorSheetOpen, setEditorSheetOpen] = useState(false);
    const [isAuthSheetOpen, setAuthSheetOpen] = useState(false);
    const [isAboutSheetOpen, setAboutSheetOpen] = useState(false);
    const [isSignOutSheetOpen, setSignOutSheetOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const { canInstall, install, isIOS } = usePWA();
    const [isInstallSheetOpen, setInstallSheetOpen] = useState(false);

    const isAnon = !user || user.is_anonymous;

    // --- Розумний міст з пошуку адрес ---
    useEffect(() => {
        // Parse params from hash routing query part
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1 && !isAnon) {
            const params = new URLSearchParams(hash.substring(queryIndex));
            const setupPush = params.get('setupPush');
            const subGroup = params.get('subGroup');

            if (setupPush === 'true' && subGroup) {
                // Find existing slot with this subgroup or edit the first inactive slot
                const existingSlot = slots.find(s => s.subGroup === subGroup && s.isActive);
                if (existingSlot) {
                    setEditingSlot(existingSlot);
                    setEditorSheetOpen(true);
                } else {
                    const inactiveSlot = slots.find(s => !s.isActive) || slots[0];
                    if (inactiveSlot) {
                        const newSlot: Slot = {
                            ...inactiveSlot,
                            name: inactiveSlot.name || 'Оселя',
                            subGroup: subGroup,
                            isActive: true
                        };
                        setEditingSlot(newSlot);
                        setEditorSheetOpen(true);
                    }
                }
                // Clean up hash query parameters so it does not trigger again
                window.location.hash = hash.split('?')[0];
            }
        }
    }, [location, isAnon, slots]);
    
    const profile = {
        name: isAnon ? 'Гість SvitloSk' : (user?.user_metadata?.full_name || 'Google Auth Профіль'),
        status: isAnon ? 'Дані зберігаються локально' : 'Дані синхронізовані',
        avatarUrl: user?.user_metadata?.avatar_url,
        id: user?.id,
        isAnon
    };

    // --- Логіка запиту дозволу та підписки на пуші ---
    const ensurePushSubscription = async () => {
        if (isAnon) return false;
        try {
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) throw new Error("VAPID ключ не знайдено в налаштуваннях");

            // Отримуємо підписку з браузера
            const tokenJson = await subscribeToPushNotifications(vapidKey);
            
            // Відправляємо її в нашу "сліпу" базу Supabase
            const { error } = await supabase
                .from('user_push_tokens')
                .upsert({
                    user_id: user!.id,
                    push_token: JSON.parse(tokenJson),
                    device_id: navigator.userAgent, // Базовий ідентифікатор пристрою
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Помилка підписки на пуші:", error);
            alert("Не вдалося увімкнути сповіщення: " + error.message);
            return false;
        }
    };

    const handleToggleTomorrow = async () => {
        if (isAnon) {
            setAuthSheetOpen(true);
            return;
        }
        
        const newValue = !userConfig.tomorrowPush;
        
        // Якщо користувач вмикає тумблер — запитуємо дозвіл
        if (newValue) {
            const subscribed = await ensurePushSubscription();
            if (!subscribed) return; // Якщо сталася помилка або відмова, тумблер не вмикається
        }

        updateUserConfig({ tomorrowPush: newValue });
    };

    const handleShare = async () => {
        const shareData = {
            title: 'SvitloSk — Графік відключень',
            text: 'Зручний графік відключень світла для Старокостянтинова!',
            url: window.location.origin + window.location.pathname,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                alert('Посилання скопійовано у буфер обміну!');
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
    };

    const handleFeedback = () => {
        if (isAnon) {
            setAuthSheetOpen(true);
            return;
        }
        const subject = encodeURIComponent('Зворотній зв\'язок SvitloSk');
        const body = encodeURIComponent(`Користувач ID: ${user?.id}\n\nПовідомлення: `);
        window.location.href = `mailto:real.tomchuk@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleAbout = () => {
        setAboutSheetOpen(true);
    };

    const handleSaveSlot = async (slot: Slot) => {
        // При збереженні слота також перевіряємо/запитуємо дозвіл
        if (!isAnon) {
            await ensurePushSubscription(); // Пробуємо підписати на пуші, але не блокуємо збереження картки при відмові
        }

        if (slots.find(s => s.id === slot.id)) {
            updateSlot(slot);
        } else {
            addSlot(slot);
        }
    };

    return (
        <div className={clsx(styles.cabinetRoot, 'page-cabinet')}>
            <ProfileCard
                user={profile}
                onClick={() => setAuthSheetOpen(true)}
                onSignOut={() => setSignOutSheetOpen(true)}
            />
            
            <div className={styles.standaloneRowWrap} style={{ position: 'relative' }}>
                <CabinetRow
                    label={<span className={styles.slotTitle}>Показувати першою підчергу</span>}
                    onClick={() => setSubGroupSheetOpen(true)}
                    className={styles.controlPanelRow}
                    rightElement={
                        <span className={styles.slotGroup} style={{ color: 'var(--cb-brand-orange)' }}>
                            {userConfig.startGroup}
                        </span>
                    }
                />
            </div>
            
            <NotificationSlots 
                slots={slots} 
                isLocked={isAnon} 
                onRequireAuth={() => setAuthSheetOpen(true)}
                onEditSlot={(slot) => { setEditingSlot(slot); setEditorSheetOpen(true); }}
            />
            
            <GeneralSettings
                config={userConfig}
                isLocked={isAnon}
                onToggleTomorrow={handleToggleTomorrow}
                onRequireAuth={() => setAuthSheetOpen(true)}
            />
            
            {canInstall && (
                <div className={`${styles.section} ${styles.pwaInstallSection}`}>
                    <div className={styles.solidCard}>
                        <CabinetRow
                            icon={<Download size={18} strokeWidth={2.5} />}
                            label="Встановити застосунок"
                            onClick={() => setInstallSheetOpen(true)}
                            className={styles.controlPanelRow}
                        />
                    </div>
                </div>
            )}
            
            <AboutSection
                onShare={handleShare}
                onFeedback={handleFeedback}
                onAbout={handleAbout}
            />

            <SubGroupSheet 
                isOpen={isSubGroupSheetOpen} 
                onClose={() => setSubGroupSheetOpen(false)}
                selectedGroup={userConfig.startGroup}
                onSelectGroup={(g) => updateUserConfig({ startGroup: g })}
            />

            <NotificationEditorSheet
                isOpen={isEditorSheetOpen}
                onClose={() => setEditorSheetOpen(false)}
                slot={editingSlot}
                onSave={handleSaveSlot}
                onDelete={(id) => deleteSlot(id)}
            />

            <SignOutSheet
                isOpen={isSignOutSheetOpen}
                onClose={() => setSignOutSheetOpen(false)}
                onConfirm={signOut}
                userName={profile.name}
            />

            <AuthPromptSheet
                isOpen={isAuthSheetOpen}
                onClose={() => setAuthSheetOpen(false)}
                onLogin={signInWithGoogle}
            />

            <AboutSheet
                isOpen={isAboutSheetOpen}
                onClose={() => setAboutSheetOpen(false)}
            />

            <PWAInstallSheet
                isOpen={isInstallSheetOpen}
                onClose={() => setInstallSheetOpen(false)}
                isIOS={isIOS}
                onInstall={install}
            />
        </div>
    );
};
