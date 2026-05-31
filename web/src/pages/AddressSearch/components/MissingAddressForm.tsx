import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { useStore } from '@/store/useStore';
import { AutoCompleteInput } from './AutoCompleteInput';
import { BottomSheet } from '../../../components/ui/BottomSheet/BottomSheet';
import {
  loadAddressRegistry,
  getStreets
} from '../services/addressService';
import styles from '../AddressSearch.module.css';

interface MissingAddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  staticData: {
    isCity: boolean;
    okrug?: string;
    village?: string;
    street?: string;
    house?: string;
  };
  allExistingStreets: string[]; // Kept for prop compatibility
}

export const MissingAddressForm: React.FC<MissingAddressFormProps> = ({
  isOpen,
  onClose,
  staticData
}) => {
  const { user } = useStore();
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [selectedSubgroup, setSelectedSubgroup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local selection states initialized from staticData prop to allow the user to modify the location context
  const [localIsCity, setLocalIsCity] = useState(staticData.isCity);
  const [localOkrug, setLocalOkrug] = useState(staticData.okrug || '');
  const [localVillage, setLocalVillage] = useState(staticData.village || '');

  // Fetch address registry dynamically (cached)
  const { data: registry } = useQuery({
    queryKey: ['addresses', 'registry'],
    queryFn: loadAddressRegistry,
    staleTime: Infinity,
  });

  // Find all unique villages across all okrugs in the registry
  const allVillagesList = useMemo(() => {
    if (!registry) return [];
    const okrugs = Object.keys(registry).filter(key => key !== 'Місто');
    const villagesSet = new Set<string>();
    for (const okrug of okrugs) {
      const okrugData = registry[okrug];
      if (okrugData) {
        Object.keys(okrugData).forEach(v => villagesSet.add(v));
      }
    }
    return Array.from(villagesSet).sort();
  }, [registry]);

  // Filtered list of villages for the current selected okrug.
  // If no okrug is selected, show all villages.
  const localVillagesList = useMemo(() => {
    if (!registry) return [];
    if (!localOkrug) return allVillagesList;
    const okrugData = registry[localOkrug];
    if (!okrugData) return allVillagesList;
    return Object.keys(okrugData).sort();
  }, [registry, localOkrug, allVillagesList]);

  // Helper to find the okrug for a selected village
  const findOkrugForVillage = (villageName: string): string => {
    if (!registry) return '';
    const okrugs = Object.keys(registry).filter(key => key !== 'Місто');
    for (const okrug of okrugs) {
      const okrugData = registry[okrug];
      if (okrugData && okrugData[villageName]) {
        return okrug;
      }
    }
    return '';
  };

  // Reset/sync local states to static prop context on modal opening
  useEffect(() => {
    if (isOpen) {
      setStreet(staticData.street || '');
      setHouse(staticData.house || '');
      setSelectedSubgroup('');
      setErrorMsg(null);
      
      const isCityVal = staticData.isCity;
      setLocalIsCity(isCityVal);
      
      if (isCityVal) {
        setLocalOkrug('');
        setLocalVillage('');
      } else {
        const v = staticData.village || '';
        const o = staticData.okrug || '';
        
        setLocalOkrug(o);
        setLocalVillage(v);
        
        if (v && registry) {
          // Scan registry for okrug of this village
          const okrugs = Object.keys(registry).filter(key => key !== 'Місто');
          let resolvedOkrug = '';
          for (const okrug of okrugs) {
            if (registry[okrug] && registry[okrug][v]) {
              resolvedOkrug = okrug;
              break;
            }
          }
          if (resolvedOkrug) {
            setLocalOkrug(resolvedOkrug);
          }
        } else if (o && registry) {
          // If okrug is provided but village is empty, respect the selected okrug
          setLocalVillage('');
        } else if (registry) {
          // If neither village nor okrug provided, prefill with first one in sorted list of all villages
          const okrugs = Object.keys(registry).filter(key => key !== 'Місто');
          const vSet = new Set<string>();
          for (const okrug of okrugs) {
            if (registry[okrug]) {
              Object.keys(registry[okrug]).forEach(val => vSet.add(val));
            }
          }
          const sortedV = Array.from(vSet).sort();
          if (sortedV.length > 0) {
            const firstV = sortedV[0];
            setLocalVillage(firstV);
            
            // Find its okrug
            let resolvedO = '';
            for (const okrug of okrugs) {
              if (registry[okrug] && registry[okrug][firstV]) {
                resolvedO = okrug;
                break;
              }
            }
            setLocalOkrug(resolvedO);
          }
        }
      }
    }
  }, [isOpen, staticData, registry]);

  const localStreetsList = useMemo(() => {
    if (!registry) return [];
    return getStreets(registry, localIsCity, localOkrug, localVillage);
  }, [registry, localIsCity, localOkrug, localVillage]);

  if (!isOpen) return null;

  const handleToggleIsCity = (cityMode: boolean) => {
    setLocalIsCity(cityMode);
    setStreet('');
    if (!cityMode && allVillagesList.length > 0) {
      const firstVillage = allVillagesList[0];
      setLocalVillage(firstVillage);
      const resolvedOkrug = findOkrugForVillage(firstVillage);
      setLocalOkrug(resolvedOkrug);
    } else {
      setLocalOkrug('');
      setLocalVillage('');
    }
  };

  const handleVillageSelect = (villageVal: string) => {
    setLocalVillage(villageVal);
    setStreet('');
    const resolvedOkrug = findOkrugForVillage(villageVal);
    setLocalOkrug(resolvedOkrug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) return setErrorMsg('Будь ласка, введіть назву вулиці');
    if (!house.trim()) return setErrorMsg('Будь ласка, введіть номер будинку');

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        location_type: localIsCity ? 'city' : 'rural',
        okrug: localIsCity ? null : (localOkrug || null),
        village: localIsCity ? null : (localVillage || null),
        street: street.trim(),
        house: house.trim(),
        subgroup: selectedSubgroup || null,
        status: 'pending',
        user_id: user?.id || null
      };

      const { error } = await supabase
        .from('missing_address_requests')
        .insert(payload);

      if (error) throw error;

      alert('Дякуємо! Вашу адресу надіслано. Адміністратор додасть її найближчим часом.');
      onClose();
    } catch (err: any) {
      console.error('Error submitting missing address:', err);
      setErrorMsg(err.message || 'Помилка відправки запиту. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Повідомити про адресу">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 8px 12px' }}>
        
        {/* Segmented Location Switcher */}
        <div className={styles.formGroup}>
          <span className={styles.formGroupLabel}>Локація</span>
          <div className={styles.toggleGroup} style={{ marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => handleToggleIsCity(true)}
              className={`${styles.toggleButton} ${localIsCity ? styles.toggleButtonActive : ''}`}
            >
              Старокостянтинів
            </button>
            <button
              type="button"
              onClick={() => handleToggleIsCity(false)}
              className={`${styles.toggleButton} ${!localIsCity ? styles.toggleButtonActive : ''}`}
            >
              Населені пункти громади
            </button>
          </div>
        </div>

        {/* Expandable Village selector for Rural settlements (No Okrug Selector) */}
        {!localIsCity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.25s ease' }}>
            <AutoCompleteInput
              label="Оберіть село"
              placeholder="Введіть назву села або оберіть зі списку"
              value={localVillage}
              onChange={handleVillageSelect}
              suggestions={localVillagesList}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Autocomplete / Input Street */}
        <AutoCompleteInput
          label="Вулиця (оберіть або впишіть нову)"
          placeholder="Введіть назву вулиці"
          value={street}
          onChange={setStreet}
          suggestions={localStreetsList}
          disabled={isSubmitting}
        />

        {/* House Number Input */}
        <div className={styles.formGroup}>
          <label className={styles.formGroupLabel}>Будинок (наприклад, 12, 15-А або 27/1)</label>
          <input
            type="text"
            value={house}
            onChange={e => setHouse(e.target.value)}
            placeholder="Введіть номер будинку"
            className={styles.textInput}
            disabled={isSubmitting}
          />
        </div>

        {/* Optional Sub-queue selection pills */}
        <div className={styles.formGroup}>
          <label className={styles.formGroupLabel}>Підчерга (якщо відомо, необов'язково)</label>
          <div className={styles.subgroupGrid}>
            {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'].map(g => (
              <button
                key={g}
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedSubgroup(selectedSubgroup === g ? '' : g)}
                className={`${styles.subgroupChip} ${selectedSubgroup === g ? styles.subgroupChipActive : ''}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="text-red-500 text-xs font-semibold px-1" style={{ color: '#ef4444' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className={styles.buttonStack} style={{ marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.capsuleBtn} ${styles.capsuleOrange}`}
          >
            {isSubmitting ? 'Надсилання...' : 'Надіслати адресу'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`${styles.capsuleBtn} ${styles.capsuleGray}`}
          >
            Скасувати
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
