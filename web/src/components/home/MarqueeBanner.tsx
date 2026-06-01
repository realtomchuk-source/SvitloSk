import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

type BannerAnnouncement = {
  id: string;
  text: string;
  sort_order: number;
};

export function MarqueeBanner({ isOn = true }: { isOn?: boolean }) {
  const [announcements, setAnnouncements] = useState<BannerAnnouncement[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const speedRef = useRef(0.7);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const load = async () => {
      const { data, error } = await supabase
        .from('system_announcements')
        .select('id, text, sort_order')
        .eq('status', 'published')
        .eq('is_active', true)
        .eq('active_date', today)
        .order('sort_order', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setAnnouncements(data);
      }
    };

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || announcements.length === 0) return;

    let paused = false;

    const animate = () => {
      if (!paused && viewport) {
        viewport.scrollLeft += speedRef.current;
        const halfWidth = viewport.scrollWidth / 2;
        if (viewport.scrollLeft >= halfWidth) {
          viewport.scrollLeft -= halfWidth;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const handlePause = () => { paused = true; };
    const handleResume = () => { paused = false; };
    viewport.addEventListener('mouseenter', handlePause);
    viewport.addEventListener('mouseleave', handleResume);
    viewport.addEventListener('touchstart', handlePause, { passive: true });
    viewport.addEventListener('touchend', handleResume);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      viewport.removeEventListener('mouseenter', handlePause);
      viewport.removeEventListener('mouseleave', handleResume);
      viewport.removeEventListener('touchstart', handlePause);
      viewport.removeEventListener('touchend', handleResume);
    };
  }, [announcements]);

  if (announcements.length === 0) return null;

  const renderContent = () => (
    <>
      {announcements.map((a, i) => (
        <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: isOn ? 'rgba(238,114,33,0.35)' : 'rgba(142,142,147,0.4)', padding: '0 14px', fontSize: '8px' }}>●</span>}
          <span style={{ color: '#3a3a3c', fontSize: '15px', fontWeight: 500, paddingRight: '6px' }}>{a.text}</span>
        </span>
      ))}
      <span style={{ padding: '0 40px' }} />
    </>
  );

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '16px',
      margin: '0 20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      border: isOn ? '1px solid rgba(238, 114, 33, 0.25)' : '1.2px solid rgba(142, 142, 147, 0.3)',
      overflow: 'hidden',
      height: '54px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      {/* Edge Fade Masks (Slightly narrower at 32px for subtle effect) */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '32px',
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '32px',
        background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      <div
        ref={viewportRef}
        style={{
          overflowX: 'scroll',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          minWidth: 'max-content',
        }}>
          {renderContent()}
          {renderContent()}
        </div>
      </div>
      <style>{`.mq-viewport::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
