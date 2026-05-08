import React, { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import styles from './SubqueueSelector.module.css';

// ── Constants ──────────────────────────────────────────────────────────────────
const GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];
const CLONE = GROUPS.length;                         // 12
const ITEMS = [...GROUPS, ...GROUPS, ...GROUPS];     // 36 total
const CARD_W = 78;
const GAP = 10;
const STEP = CARD_W + GAP;                           // 82px per snap step

// ── DrumCard (React.memo — prevents re-renders on scroll) ─────────────────────
interface DrumCardProps {
    group: string;
    isSelected: boolean;
    onClick: () => void;
}

const DrumCard = React.memo<DrumCardProps>(({ group, isSelected, onClick }) => (
    <div
        className={`${styles.card}${isSelected ? ` ${styles.cardActive}` : ''}`}
        onClick={onClick}
    >
        <span className={styles.groupNum}>{group}</span>
        <AnimatePresence mode="wait">
            {isSelected && (
                <motion.span
                    key="drum-label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className={styles.label}
                >
                    підчерга
                </motion.span>
            )}
        </AnimatePresence>
    </div>
));
DrumCard.displayName = 'DrumCard';

// ── SubqueueSelector ───────────────────────────────────────────────────────────
export const SubqueueSelector: React.FC = () => {
    const { selectedGroup = '1.1', setSelectedGroup } = useStore();

    const viewportRef    = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);     // blocks useEffect during user scroll
    const isInitialMount = useRef(true);      // skips animation on first render
    const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Desktop: convert vertical mouse wheel → horizontal scroll ────────────────
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;
        // deltaY from vertical wheel → horizontal scroll
        viewport.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        // passive: false is required to allow preventDefault()
        viewport.addEventListener('wheel', handleWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // ── Core: called after scroll stops ─────────────────────────────────────────
    const handleSnapEnd = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const rawIdx     = Math.round(viewport.scrollLeft / STEP);
        const normalized = ((rawIdx % CLONE) + CLONE) % CLONE;
        const newGroup   = GROUPS[normalized];

        // Release scroll lock BEFORE setSelectedGroup so useEffect won't fight us
        isScrollingRef.current = false;

        // Update global state
        setSelectedGroup(newGroup);

        // Haptic
        if (window.navigator.vibrate) window.navigator.vibrate(10);

        // Circular instant jump: silently teleport to middle copy
        const needsJump = rawIdx < CLONE || rawIdx >= CLONE * 2;
        if (needsJump) {
            viewport.scrollLeft = (CLONE + normalized) * STEP;
        }
    }, [setSelectedGroup]);

    // ── Scroll listener (debounce covers all browsers incl. old Safari) ─────────
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const onScroll = () => {
            isScrollingRef.current = true;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(handleSnapEnd, 150);
        };

        // scrollend gives instant response on modern browsers
        const onScrollEnd = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            handleSnapEnd();
        };

        const supportsScrollEnd = 'onscrollend' in window;

        viewport.addEventListener('scroll', onScroll, { passive: true });
        if (supportsScrollEnd) {
            viewport.addEventListener('scrollend', onScrollEnd);
        }

        return () => {
            viewport.removeEventListener('scroll', onScroll);
            if (supportsScrollEnd) viewport.removeEventListener('scrollend', onScrollEnd);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [handleSnapEnd]);

    // ── Initial position + external sync (e.g. changed from Cabinet) ────────────
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const groupIdx = GROUPS.indexOf(selectedGroup);
        if (groupIdx === -1) return;

        const targetLeft = (CLONE + groupIdx) * STEP;

        if (isInitialMount.current) {
            // Instant — no animation on first render
            viewport.scrollLeft = targetLeft;
            isInitialMount.current = false;
            return;
        }

        // Guard: skip if user is currently dragging
        if (isScrollingRef.current) return;

        // Guard: skip if already at correct position (avoids double-scroll after handleSnapEnd)
        if (Math.abs(viewport.scrollLeft - targetLeft) < 2) return;

        viewport.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }, [selectedGroup]);

    // ── Scroll to a specific group (onClick handler) ─────────────────────────────
    const scrollToGroup = useCallback((group: string) => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const groupIdx = GROUPS.indexOf(group);
        if (groupIdx === -1) return;

        // Find the closest occurrence across all three copies
        const currentIdx = Math.round(viewport.scrollLeft / STEP);
        const candidates = [groupIdx, CLONE + groupIdx, 2 * CLONE + groupIdx];
        const closestIdx = candidates.reduce((best, c) =>
            Math.abs(c - currentIdx) < Math.abs(best - currentIdx) ? c : best
        );

        viewport.scrollTo({ left: closestIdx * STEP, behavior: 'smooth' });
    }, []);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>

                {/* Decorative center frame — static, outside map() */}
                <div className={styles.centerFrame} />

                {/* Orange pill indicator — static, outside map() */}
                <div className={styles.activePill} />

                {/* Scroll drum */}
                <div ref={viewportRef} className={styles.viewport} style={{ cursor: 'grab' }} onMouseDown={(e) => { e.currentTarget.style.cursor = 'grabbing'; }} onMouseUp={(e) => { e.currentTarget.style.cursor = 'grab'; }} onMouseLeave={(e) => { e.currentTarget.style.cursor = 'grab'; }}>
                    <div className={styles.track}>
                        {ITEMS.map((group, index) => (
                            <DrumCard
                                key={index}
                                group={group}
                                isSelected={group === selectedGroup}
                                onClick={() => scrollToGroup(group)}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};