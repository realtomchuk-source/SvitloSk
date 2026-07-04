import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

type BannerAnnouncement = {
  id: string;
  text: string;
  sort_order: number;
};

// Kyiv Timezone Helpers
const getKyivDateTime = (date: Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const dateMap: Record<string, string> = {};
  parts.forEach(p => { dateMap[p.type] = p.value; });
  
  const hour = parseInt(dateMap.hour, 10);
  const minute = parseInt(dateMap.minute, 10);
  
  return {
    dateISO: `${dateMap.year}-${dateMap.month}-${dateMap.day}`, // YYYY-MM-DD
    hour,
    minute,
    minutesOfDay: hour * 60 + minute
  };
};

const getKyivTomorrowDateISO = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return getKyivDateTime(tomorrow).dateISO;
};

export function MarqueeBanner({ isOn = true }: { isOn?: boolean }) {
  const [announcements, setAnnouncements] = useState<BannerAnnouncement[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const speedRef = useRef(0.7);

  const currentLoadedDateRef = useRef<string>('');
  const lastFetchedTimeRef = useRef<number>(0);
  const currentFeedTextRef = useRef<string>('');

  useEffect(() => {
    const kyivInfo = getKyivDateTime();
    currentLoadedDateRef.current = kyivInfo.dateISO;

    const load = async () => {
      const now = new Date();
      const currentKyiv = getKyivDateTime(now);
      const todayISO = currentKyiv.dateISO;
      const tomorrowISO = getKyivTomorrowDateISO();
      const isWindow = currentKyiv.minutesOfDay >= 1400; // 23:20 is 23*60 + 20 = 1400 minutes

      // 1. Fetch settings from Supabase for today
      let mode: 'append' | 'override' = 'append';
      try {
        const { data: settingsData } = await supabase
          .from('news_feed_settings')
          .select('mode')
          .eq('active_date', todayISO)
          .maybeSingle();
        if (settingsData && settingsData.mode) {
          mode = settingsData.mode as 'append' | 'override';
        }
      } catch (e) {
        console.warn('Failed to fetch feed settings', e);
      }

      // 2. Fetch custom announcements from Supabase for today
      let customText = '';
      if (mode === 'append' || mode === 'override') {
        try {
          const { data: dbData } = await supabase
            .from('system_announcements')
            .select('text')
            .eq('status', 'published')
            .eq('is_active', true)
            .eq('active_date', todayISO)
            .order('sort_order', { ascending: true });
          if (dbData && dbData.length > 0) {
            customText = dbData.map(a => a.text).join(' | ');
          }
        } catch (e) {
          console.warn('Failed to fetch system announcements', e);
        }
      }

      // 3. Handle GitHub feed fetching
      let githubFeed = '';
      if (mode === 'append') {
        const feedUrl = `https://raw.githubusercontent.com/realtomchuk-source/OutagesSk/main/data/feed.txt?t=${Date.now()}`;
        
        if (isWindow) {
          // 23:20-00:00 - GitHub raw text file is updated with tomorrow's feed.
          // Fetch it and store as tomorrow's feed.
          try {
            const res = await fetch(feedUrl);
            if (res.ok) {
              const text = await res.text();
              const trimmed = text.trim();
              if (trimmed) {
                localStorage.setItem(`sssk_github_feed_${tomorrowISO}`, trimmed);
              }
            }
          } catch (e) {
            console.error('Failed to pre-fetch tomorrow feed:', e);
          }

          // Display today's cached feed if available, or fall back to immediate fetch
          const cachedToday = localStorage.getItem(`sssk_github_feed_${todayISO}`);
          if (cachedToday) {
            githubFeed = cachedToday;
          } else {
            try {
              const res = await fetch(feedUrl);
              if (res.ok) {
                githubFeed = (await res.text()).trim();
              }
            } catch (e) {
              console.error('Failed to load fallback github feed:', e);
            }
          }
        } else {
          // Normal hours: 00:00-23:20. Fetch today's feed from GitHub.
          try {
            const res = await fetch(feedUrl);
            if (res.ok) {
              const text = await res.text();
              const trimmed = text.trim();
              if (trimmed) {
                githubFeed = trimmed;
                localStorage.setItem(`sssk_github_feed_${todayISO}`, trimmed);
              }
            }
          } catch (e) {
            console.error('Failed to fetch github feed:', e);
            // Fallback to cache
            githubFeed = localStorage.getItem(`sssk_github_feed_${todayISO}`) || '';
          }
        }
      }

      // 4. Combine
      let finalFeedText = '';
      if (mode === 'override') {
        finalFeedText = customText;
      } else {
        // mode === 'append'
        if (githubFeed && customText) {
          finalFeedText = `${githubFeed} | ${customText}`;
        } else {
          finalFeedText = githubFeed || customText;
        }
      }

      // 5. Update state only if text changed (prevents marquee resetting/glitching)
      if (finalFeedText !== currentFeedTextRef.current) {
        currentFeedTextRef.current = finalFeedText;
        if (finalFeedText) {
          setAnnouncements([{ id: 'feed', text: finalFeedText, sort_order: 1 }]);
        } else {
          setAnnouncements([]);
        }
      }
      
      lastFetchedTimeRef.current = Date.now();
    };

    load();

    // Check date change every 60 seconds (Kyiv time)
    // Poll updates from GitHub every 15 minutes
    const interval = setInterval(() => {
      const now = new Date();
      const currentKyiv = getKyivDateTime(now);
      
      if (currentKyiv.dateISO !== currentLoadedDateRef.current) {
        currentLoadedDateRef.current = currentKyiv.dateISO;
        load();
      } else if (Date.now() - lastFetchedTimeRef.current >= 15 * 60 * 1000) {
        load();
      }
    }, 60 * 1000);

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

  const isLoading = announcements.length === 0;

  const parseAnnouncementText = (text: string) => {
    const regex = /([Оо]новлено\s+[оо0]\s+\d{1,2}:\d{2})|([Зз]неструмлення:\s*)([а-яА-ЯёЁіІїЇєЄґҐ\s'-]+?)(\s*\()|([Сс]тарокостянтинів[а-яА-ЯёЁіІїЇєЄґҐ]*)|(\|)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      if (match[1]) {
        parts.push(
          <span key={`update-${matchIndex}`} style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
            {match[1]}
          </span>
        );
      } else if (match[3]) {
        parts.push(match[2]);
        parts.push(
          <span key={`village-${matchIndex}`} style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
            {match[3]}
          </span>
        );
        parts.push(match[4]);
      } else if (match[5]) {
        parts.push(
          <span key={`city-${matchIndex}`} style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
            {match[5]}
          </span>
        );
      } else if (match[6]) {
        parts.push(
          <span key={`sep-${matchIndex}`} style={{ color: 'var(--color-orange)', fontWeight: 700, padding: '0 4px' }}>
            {match[6]}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const renderContent = () => (
    <>
      {announcements.map((a, i) => (
        <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: isOn ? 'var(--color-orange-glow-35)' : 'rgba(142,142,147,0.4)', padding: '0 14px', fontSize: '8px' }}>●</span>}
          <span style={{ color: '#3a3a3c', fontSize: '16px', fontWeight: 500, paddingRight: '6px' }}>
            {parseAnnouncementText(a.text)}
          </span>
        </span>
      ))}
      <span style={{ padding: '0 40px' }} />
    </>
  );

  return (
    <div 
      className={isLoading ? "animate-pulse" : ""}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        margin: '0 20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        border: isOn ? '1px solid var(--color-orange-glow-20)' : '1.2px solid rgba(142, 142, 147, 0.3)',
        overflow: 'hidden',
        height: '54px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Edge Fade Masks */}
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
          {!isLoading && (
            <>
              {renderContent()}
              {renderContent()}
            </>
          )}
        </div>
      </div>
      <style>{`.mq-viewport::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
