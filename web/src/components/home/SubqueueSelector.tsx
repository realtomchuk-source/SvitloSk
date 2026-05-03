import React, { useRef, useState, useEffect } from 'react';

interface SubqueueSelectorProps {
  selectedGroup: string;
  onSelect: (group: string) => void;
}

const GROUPS = [
  '1.1', '1.2', '2.1', '2.2', '3.1', '3.2', 
  '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'
];

export const SubqueueSelector: React.FC<SubqueueSelectorProps> = ({ 
  selectedGroup, 
  onSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items] = useState([...GROUPS, ...GROUPS, ...GROUPS]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(GROUPS.length + GROUPS.indexOf(selectedGroup));

  const startX = useRef(0);
  const currentScrollLeft = useRef(0);

  const cardWidth = 64; 
  const cardGap = 12;
  const itemWidth = cardWidth + cardGap; 

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const centerIndex = GROUPS.length + GROUPS.indexOf(selectedGroup);
      setActiveIndex(centerIndex);
      // Center the active card precisely
      const targetScroll = centerIndex * itemWidth;
      containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [selectedGroup]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    if (containerRef.current) {
      currentScrollLeft.current = containerRef.current.scrollLeft;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - startX.current;
    containerRef.current.scrollLeft = currentScrollLeft.current - dx;
    
    // Active index is simply scrollLeft / itemWidth
    const closestIndex = Math.round(containerRef.current.scrollLeft / itemWidth);
    if (closestIndex !== activeIndex && closestIndex >= 0 && closestIndex < items.length) {
      setActiveIndex(closestIndex);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (!containerRef.current) return;
    
    const closestIndex = Math.round(containerRef.current.scrollLeft / itemWidth);
    
    let targetIndex = closestIndex;
    if (targetIndex < GROUPS.length) targetIndex += GROUPS.length;
    else if (targetIndex >= GROUPS.length * 2) targetIndex -= GROUPS.length;

    const targetGroup = items[targetIndex];
    onSelect(targetGroup);
    
    const targetScroll = targetIndex * itemWidth;
    containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: '0 20px', marginTop: '30px', marginBottom: '100px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Outer Container with Orange Border */}
      <div 
        style={{
          border: '1px solid #FF7A00',
          borderRadius: '24px',
          padding: '16px 0',
          background: '#FFFFFF',
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}
      >
        {/* Edge Fade Gradients */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: 'linear-gradient(to right, #FFFFFF 20%, transparent)', zIndex: 5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40px', background: 'linear-gradient(to left, #FFFFFF 20%, transparent)', zIndex: 5, pointerEvents: 'none' }} />

        {/* Scrollable Track */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: `${cardGap}px`, 
            overflowX: 'auto', 
            overflowY: 'hidden',
            padding: `0 calc(50% - ${cardWidth/2}px)`, 
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            touchAction: 'pan-x',
            cursor: isDragging ? 'grabbing' : 'grab',
            height: '76px', 
            alignItems: 'center'
          }}
        >
          {items.map((group, index) => {
            const isActive = index === activeIndex;
            
            return (
              <div
                key={`${group}-${index}`}
                onClick={() => { if (!isDragging) onSelect(group); }}
                style={{
                  flex: `0 0 ${cardWidth}px`,
                  height: `${cardWidth}px`, // Perfectly square
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFFFFF',
                  border: isActive ? '2.5px solid #FF7A00' : '1px solid rgba(0,0,0,0.1)',
                  boxShadow: isActive ? '0 0 20px rgba(255, 122, 0, 0.4)' : 'none',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: isActive ? 2 : 1
                }}
              >
                <span style={{ 
                  fontSize: isActive ? '22px' : '18px', 
                  fontWeight: isActive ? 800 : 700, 
                  color: isActive ? '#111' : '#6B7280',
                  lineHeight: 1
                }}>
                  {group}
                </span>
                
                {/* Preserve space for the label even if inactive to maintain geometry */}
                <span style={{ 
                  fontSize: '8px', 
                  fontWeight: 600, 
                  color: '#888', 
                  marginTop: '2px', 
                  letterSpacing: '0.2px',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.2s'
                }}>
                  підчерга
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};