import React, { useRef, useEffect, useState } from 'react';
import styles from './DrumPicker.module.css';

interface DrumPickerProps {
  items: string[];
  selectedItem: string;
  onChange: (item: string) => void;
  onConfirm?: (item: string) => void;
  label?: string;
  stripSuffix?: boolean;
}

export const DrumPicker: React.FC<DrumPickerProps> = ({
  items,
  selectedItem,
  onChange,
  onConfirm,
  label,
  stripSuffix = true,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Programmatically strip redundant suffix
  const cleanItemName = (name: string) => {
    if (!name) return '';
    if (stripSuffix) {
      return name.replace(/\s*старостинський\s*округ\s*/gi, '').trim();
    }
    return name;
  };

  // Find index of selected item
  const selectedIndex = items.indexOf(selectedItem);
  const effectiveIndex = selectedIndex !== -1 ? selectedIndex : 0;

  // Initialize and synchronize scroll position with parent selectedItem state
  useEffect(() => {
    if (listRef.current && items.length > 0) {
      const targetScrollTop = effectiveIndex * 40;
      // Scroll to the active item smoothly if the visual index doesn't match the state
      if (Math.abs(listRef.current.scrollTop - targetScrollTop) > 2) {
        listRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
      setActiveIndex(effectiveIndex);
    }
  }, [effectiveIndex, items]);

  const handleScroll = () => {
    if (!listRef.current) return;
    setIsScrolling(true);
    const scrollTop = listRef.current.scrollTop;
    
    // Calculate which item is currently closest to the center focus lane
    const index = Math.round(scrollTop / 40);
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    
    if (safeIndex !== activeIndex) {
      setActiveIndex(safeIndex);
    }

    // Debounce the state change so it only triggers the parent onChange when the scroll stops
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      // Double check that it has snapped exactly, or trigger it
      if (listRef.current) {
        const finalScrollTop = listRef.current.scrollTop;
        const finalIndex = Math.round(finalScrollTop / 40);
        const finalSafeIndex = Math.max(0, Math.min(items.length - 1, finalIndex));
        
        onChange(items[finalSafeIndex]);
      }
    }, 120); // 120ms threshold to detect scroll end
  };

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleItemClick = (index: number) => {
    if (listRef.current) {
      if (index === activeIndex) {
        // Tapped the already active center item -> CONFIRM!
        if (onConfirm) {
          onConfirm(items[index]);
        }
      } else {
        // Tapped a non-centered item -> scroll it to center
        listRef.current.scrollTo({
          top: index * 40,
          behavior: 'smooth',
        });
        setActiveIndex(index);
        onChange(items[index]);
      }
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.drumContainer} style={{ animation: 'fadeIn 0.3s ease' }}>
      {label && <span className={styles.drumLabel}>{label}</span>}
      <div className={styles.drumWheel}>
        {/* Highlight area in the exact middle */}
        <div className={styles.drumFocusLane} />

        {/* Scrollable list of items */}
        <div
          ref={listRef}
          className={`${styles.drumList} ${isScrolling ? styles.scrolling : ''}`}
          onScroll={handleScroll}
        >
          {/* Top spacer (height 60px) to allow the first item to center snap */}
          <div className={styles.drumSpacer} />

          {items.map((item, idx) => {
            const distance = Math.abs(idx - activeIndex);
            
            // Calculate 3D transformation and opacity based on distance from center
            let opacity = 1;
            let scale = 1;
            let rotateX = 0;
            let translateY = 0;

            if (distance === 0) {
              opacity = 1;
              scale = 1.05;
              rotateX = 0;
              translateY = 0;
            } else if (distance === 1) {
              opacity = 0.65;
              scale = 0.92;
              rotateX = (idx < activeIndex) ? 20 : -20;
              translateY = (idx < activeIndex) ? 2 : -2;
            } else {
              opacity = 0.3;
              scale = 0.8;
              rotateX = (idx < activeIndex) ? 40 : -40;
              translateY = (idx < activeIndex) ? 4 : -4;
            }

            return (
              <div
                key={item}
                onClick={() => handleItemClick(idx)}
                className={`${styles.drumItem} ${distance === 0 ? styles.drumItemActive : ''}`}
                style={{
                  opacity,
                  transform: `perspective(200px) rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`,
                }}
              >
                <span>{cleanItemName(item)}</span>
                {distance === 0 && onConfirm && (
                  <span className={styles.drumItemConfirmChevron}>
                    →
                  </span>
                )}
              </div>
            );
          })}

          {/* Bottom spacer (height 60px) to allow the last item to center snap */}
          <div className={styles.drumSpacer} />
        </div>
      </div>
    </div>
  );
};
