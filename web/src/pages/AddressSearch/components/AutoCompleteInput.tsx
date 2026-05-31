import React, { useState, useEffect, useRef } from 'react';
import styles from '../AddressSearch.module.css';

interface AutoCompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  disabled = false
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions when typing
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuggestions(suggestions); // Show all when empty
      return;
    }

    const query = value.toLowerCase().replace(/\s+/g, '');
    const filtered = suggestions.filter(item => {
      const itemNorm = item.toLowerCase().replace(/\s+/g, '');
      return itemNorm.includes(query);
    });

    setFilteredSuggestions(filtered);
  }, [value, suggestions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
        handleSelect(filteredSuggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  return (
    <div className={styles.inputGroup} ref={containerRef}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onClick={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.textInput}
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className={styles.suggestionsList}>
            {filteredSuggestions.map((item, idx) => (
              <li
                key={item}
                onClick={() => handleSelect(item)}
                className={`${styles.suggestionItem} ${idx === activeIndex ? styles.suggestionItemActive : ''}`}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
