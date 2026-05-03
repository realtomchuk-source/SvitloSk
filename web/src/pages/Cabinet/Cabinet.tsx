import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ProfileCard } from './components/ProfileCard';
import { NotificationSlots } from './components/NotificationSlots';
import { GeneralSettings } from './components/GeneralSettings';
import { AboutSection } from './components/AboutSection';
import { SubGroupSheet } from './components/SubGroupSheet';
import { NotificationEditorSheet } from './components/NotificationEditorSheet';
import { AuthPromptSheet } from './components/AuthPromptSheet';
import { AboutSheet } from './components/AboutSheet';
import { DebugPanel } from './components/DebugPanel';
import type { Slot } from '@/schemas/user';
import styles from './Cabinet.module.css';

export const Cabinet: React.FC = () => {
    const { user, userConfig, updateUserConfig, slots, addSlot, updateSlot, deleteSlot, signInWithGoogle } = useStore();

    const [isSubGroupSheetOpen, setSubGroupSheetOpen] = useState(false);
    const [isEditorSheetOpen, setEditorSheetOpen] = useState(false);
    const [isAuthSheetOpen, setAuthSheetOpen] = useState(false);
    const [isAboutSheetOpen, setAboutSheetOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

    const isAnon = !user || user.is_anonymous;
    
    const profile = {
        name: isAnon ? 'Гість SvitloSk' : (user?.user_metadata?.full_name || 'Google Auth Профіль'),
        status: isAnon ? 'Дані зберігаються локально' : 'Дані синхронізовані',
        avatarUrl: user?.user_metadata?.avatar_url,
        id: user?.id,
        isAnon
    };

    const handleToggleTomorrow = () => {
        if (isAnon) {
            setAuthSheetOpen(true);
            return;
        }
        updateUserConfig({ tomorrowPush: !userConfig.tomorrowPush });
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

    const handleSaveSlot = (slot: Slot) => {
        if (slots.find(s => s.id === slot.id)) {
            updateSlot(slot);
        } else {
            addSlot(slot);
        }
    };

    return (
        <div className={styles.container}>
            <ProfileCard user={profile} onClick={() => setAuthSheetOpen(true)} />
            
            <NotificationSlots 
                slots={slots} 
                isLocked={isAnon} 
                onRequireAuth={() => setAuthSheetOpen(true)}
                onAddSlot={() => { setEditingSlot(null); setEditorSheetOpen(true); }}
                onEditSlot={(slot) => { setEditingSlot(slot); setEditorSheetOpen(true); }}
            />
            
            <GeneralSettings
                config={userConfig}
                isLocked={isAnon}
                onToggleTomorrow={handleToggleTomorrow}
                onChangeStartGroup={() => setSubGroupSheetOpen(true)}
                onRequireAuth={() => setAuthSheetOpen(true)}
            />
            
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

            <AuthPromptSheet
                isOpen={isAuthSheetOpen}
                onClose={() => setAuthSheetOpen(false)}
                onLogin={signInWithGoogle}
            />

            <AboutSheet
                isOpen={isAboutSheetOpen}
                onClose={() => setAboutSheetOpen(false)}
            />

            <DebugPanel />
        </div>
    );
};
