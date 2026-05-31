import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { getStatusInfo } from '@/services/scheduleService';
import {
  loadAddressRegistry,
  getOkrugs,
  getVillages,
  getStreets,
  getHouses,
  findSubGroup
} from './services/addressService';
import { AutoCompleteInput } from './components/AutoCompleteInput';
import { MissingAddressForm } from './components/MissingAddressForm';
import { DrumPicker } from './components/DrumPicker';
import { HelpCircle } from 'lucide-react';
import styles from './AddressSearch.module.css';

export const AddressSearch: React.FC = () => {
  const navigate = useNavigate();
  const { scheduleData, user, updateUserConfig } = useStore();
  const isAnon = !user || user.is_anonymous;

  // Query to fetch the address registry dynamically
  const { data: registry, isLoading, isError } = useQuery({
    queryKey: ['addresses', 'registry'],
    queryFn: loadAddressRegistry,
    staleTime: Infinity, // Keep in memory permanently
  });

  // Local selection states
  const [isCity, setIsCity] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOkrug, setSelectedOkrug] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [houseSearchQuery, setHouseSearchQuery] = useState('');
  const [isMissingFormOpen, setIsMissingFormOpen] = useState(false);

  // Reference for smooth automatic transition timeouts
  const transitionTimeoutRef = useRef<any>(null);

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTransitionTimeout();
  }, []);

  // Lists for selection based on parent state
  const okrugsList = useMemo(() => (registry ? getOkrugs(registry) : []), [registry]);
  const villagesList = useMemo(() => {
    if (!registry || isCity || !selectedOkrug) return [];
    return getVillages(registry, selectedOkrug);
  }, [registry, isCity, selectedOkrug]);

  const streetsList = useMemo(() => {
    if (!registry) return [];
    return getStreets(registry, isCity, selectedOkrug, selectedVillage);
  }, [registry, isCity, selectedOkrug, selectedVillage]);

  const housesList = useMemo(() => {
    if (!registry || !selectedStreet) return [];
    return getHouses(registry, isCity, selectedStreet, selectedOkrug, selectedVillage);
  }, [registry, selectedStreet, isCity, selectedOkrug, selectedVillage]);

  const filteredHousesList = useMemo(() => {
    if (!houseSearchQuery.trim()) return housesList;
    const query = houseSearchQuery.trim().toLowerCase();
    return housesList.filter(hNum => hNum.toLowerCase().includes(query));
  }, [housesList, houseSearchQuery]);

  // Pre-select when toggled or loaded to ensure no blank picker state
  useEffect(() => {
    if (!isCity && registry) {
      const oList = getOkrugs(registry);
      if (oList.length > 0) {
        if (!selectedOkrug) {
          const firstOkrug = oList[0];
          setSelectedOkrug(firstOkrug);
          const vList = getVillages(registry, firstOkrug);
          if (vList.length > 0) {
            setSelectedVillage(vList[0]);
          }
        } else {
          // If okrug is selected but village is not, or is invalid
          const vList = getVillages(registry, selectedOkrug);
          if (vList.length > 0 && (!selectedVillage || !vList.includes(selectedVillage))) {
            setSelectedVillage(vList[0]);
          }
        }
      }
    }
  }, [isCity, registry, selectedOkrug, selectedVillage]);

  // Found Subgroup logic
  const foundSubGroupVal = useMemo(() => {
    if (!registry || !selectedStreet || !selectedHouse) return null;
    return findSubGroup(registry, isCity, selectedStreet, selectedHouse, selectedOkrug, selectedVillage);
  }, [registry, isCity, selectedStreet, selectedHouse, selectedOkrug, selectedVillage]);

  const isSelectionComplete = (isCity && currentStep === 3) || (!isCity && currentStep === 5);

  // Live status calculation (strictly Orange vs Gray)
  const liveStatus = useMemo(() => {
    if (!foundSubGroupVal || !scheduleData) return null;
    
    // Fetch schedule string (e.g. "11110000...")
    const scheduleStr = scheduleData.queues[foundSubGroupVal] || "1".repeat(24);
    const info = getStatusInfo(scheduleStr, new Date());
    
    return {
      isOn: info.isCurrentlyOn,
      timeH: info.h,
      timeM: info.m,
      nextChangeHour: info.nextChangeHour
    };
  }, [foundSubGroupVal, scheduleData]);

  // Handle setting as app starter subgroup
  const handleSetStarterSubGroup = async () => {
    if (!foundSubGroupVal || foundSubGroupVal === 'needs_clarification') return;
    
    await updateUserConfig({ startGroup: foundSubGroupVal });
    
    // Navigate to Cabinet to confirm
    navigate('/cabinet');
  };

  // Handle push setup redirect
  const handleSetupPush = async () => {
    if (!foundSubGroupVal || foundSubGroupVal === 'needs_clarification' || isAnon) return;
    
    // Redirect to Cabinet and open notifications editor without changing starter group
    navigate(`/cabinet?setupPush=true&subGroup=${foundSubGroupVal}`);
  };

  // Helper to strip redundant okrug suffix
  const cleanOkrug = (okrug: string) => {
    if (!okrug) return '';
    return okrug.replace(/\s*старостинський\s*округ\s*/gi, '').trim();
  };

  // Reset child selectors when parent selections change
  const handleSettlementTypeChange = (cityMode: boolean) => {
    clearTransitionTimeout();
    setIsCity(cityMode);
    setSelectedStreet('');
    setSelectedHouse('');
    setHouseSearchQuery('');
    setCurrentStep(1);
    if (!cityMode && registry) {
      const oList = getOkrugs(registry);
      if (oList.length > 0) {
        const firstOkrug = oList[0];
        setSelectedOkrug(firstOkrug);
        const vList = getVillages(registry, firstOkrug);
        if (vList.length > 0) {
          setSelectedVillage(vList[0]);
        } else {
          setSelectedVillage('');
        }
      }
    } else {
      setSelectedOkrug('');
      setSelectedVillage('');
    }
  };

  const handleOkrugChange = (okrug: string) => {
    setSelectedOkrug(okrug);
    setSelectedStreet('');
    setSelectedHouse('');
    setHouseSearchQuery('');
    if (registry) {
      const vList = getVillages(registry, okrug);
      if (vList.length > 0) {
        setSelectedVillage(vList[0]);
      } else {
        setSelectedVillage('');
      }
    } else {
      setSelectedVillage('');
    }
  };

  const handleVillageChange = (village: string) => {
    setSelectedVillage(village);
    setSelectedStreet('');
    setSelectedHouse('');
    setHouseSearchQuery('');
  };

  const handleStreetChange = (val: string) => {
    setSelectedStreet(val);
    setSelectedHouse('');
    setHouseSearchQuery('');
    if (streetsList.includes(val)) {
      setCurrentStep(isCity ? 2 : 4);
    }
  };

  const handleHouseSelect = (hNum: string) => {
    setSelectedHouse(hNum);
    setCurrentStep(isCity ? 3 : 5);
  };

  const handleResetSearch = () => {
    clearTransitionTimeout();
    setSelectedStreet('');
    setSelectedHouse('');
    setHouseSearchQuery('');
    setCurrentStep(1);
    if (!isCity && registry) {
      const oList = getOkrugs(registry);
      if (oList.length > 0) {
        const firstOkrug = oList[0];
        setSelectedOkrug(firstOkrug);
        const vList = getVillages(registry, firstOkrug);
        if (vList.length > 0) {
          setSelectedVillage(vList[0]);
        }
      }
    } else {
      setSelectedOkrug('');
      setSelectedVillage('');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loaderContainer}>
          <div className={styles.spinner} />
          <div className="text-zinc-500 text-sm font-semibold">Синхронізація бази адрес...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.root}>
        <div className={styles.loaderContainer}>
          <div className="text-red-500 text-sm font-bold text-center">
            ⚠️ Помилка завантаження адрес.<br />Будь ласка, перевірте з'єднання з мережею.
          </div>
        </div>
      </div>
    );
  }

  const searchFormCard = (
    <div className={styles.card}>
      {/* Territory Toggle (Місто / Округи) — Visible only during active search */}
      {!isSelectionComplete && (
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Оберіть адресу</span>
          <div className={styles.toggleGroup}>
            <button
              onClick={() => handleSettlementTypeChange(true)}
              className={`${styles.toggleButton} ${isCity ? styles.toggleButtonActive : ''}`}
            >
              Старокостянтинів
            </button>
            <button
              onClick={() => handleSettlementTypeChange(false)}
              className={`${styles.toggleButton} ${!isCity ? styles.toggleButtonActive : ''}`}
            >
              Села громади
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSED STEPS (MICRO-CARDS) FOR PROGRESS REVIEWS */}

      {/* Unified Address Card (Rural only) — vertically grows as information is selected */}
      {!isCity && currentStep > 1 && selectedOkrug && (
        <div className={styles.unifiedAddressCard}>
          {/* Line 1: Okrug (Always visible) */}
          <button
            onClick={() => {
              setCurrentStep(1);
              setSelectedVillage('');
              setSelectedStreet('');
              setSelectedHouse('');
            }}
            className={styles.unifiedCardRowButton}
          >
            {cleanOkrug(selectedOkrug)} старостинський округ
          </button>

          {/* Line 2: Village (Visible from Step 3 onwards) */}
          {currentStep > 2 && selectedVillage && (
            <button
              onClick={() => {
                setCurrentStep(2);
                setSelectedStreet('');
                setSelectedHouse('');
              }}
              className={styles.unifiedCardRowButton}
            >
              с. {selectedVillage}
            </button>
          )}

          {/* Line 3: Street / House */}
          {/* Case A: Standalone Street (Visible on Step 4 while selecting a house) */}
          {currentStep === 4 && selectedStreet && (
            <button
              onClick={() => {
                setCurrentStep(3);
                setSelectedHouse('');
              }}
              className={styles.unifiedCardRowButton}
            >
              {selectedStreet}
            </button>
          )}

          {/* Case B: Combined Street & House (Visible from Step 5 when results are shown) */}
          {currentStep > 4 && selectedStreet && selectedHouse && (
            <div className={styles.unifiedCardCombinedRow}>
              <button
                onClick={() => {
                  setCurrentStep(3);
                  setSelectedHouse('');
                }}
                className={styles.unifiedCardCombinedPart}
              >
                {selectedStreet},
              </button>
              <button
                onClick={() => {
                  setCurrentStep(4);
                }}
                className={styles.unifiedCardCombinedPart}
                style={{ marginLeft: '-2px' }}
              >
                буд. {selectedHouse}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unified Address Card (City only) — visible during Step 2 */}
      {isCity && currentStep > 1 && selectedStreet && (
        <div className={styles.unifiedAddressCard}>
          {/* Line 1: Settlement Context */}
          <button
            onClick={() => {
              setCurrentStep(1);
              setSelectedStreet('');
              setSelectedHouse('');
            }}
            className={styles.unifiedCardRowButton}
          >
            м. Старокостянтинів
          </button>

          {/* Line 2: Selected Street */}
          <button
            onClick={() => {
              setCurrentStep(1);
              setSelectedHouse('');
            }}
            className={styles.unifiedCardRowButton}
          >
            {selectedStreet}
          </button>
        </div>
      )}

      {/* ACTIVE SELECTORS FOR CURRENT STEP */}

      {/* Rural Step 1: Okrug Drum Picker */}
      {!isCity && currentStep === 1 && (
        <div className={`${styles.drumPickerSection} ${styles.fadeEntry}`}>
          <span className={styles.inputLabel}>Оберіть старостинський округ</span>
          <DrumPicker
            items={okrugsList}
            selectedItem={selectedOkrug}
            onChange={handleOkrugChange}
            onConfirm={() => setCurrentStep(2)}
          />
        </div>
      )}

      {/* Rural Step 2: Village Drum Picker */}
      {!isCity && currentStep === 2 && (
        <div className={`${styles.drumPickerSection} ${styles.fadeEntry}`}>
          <span className={styles.inputLabel}>Оберіть село</span>
          <DrumPicker
            items={villagesList}
            selectedItem={selectedVillage}
            onChange={handleVillageChange}
            onConfirm={() => setCurrentStep(3)}
          />
        </div>
      )}

      {/* Rural Step 3: Street Autocomplete */}
      {!isCity && currentStep === 3 && (
        <div className={styles.fadeEntry}>
          <AutoCompleteInput
            label="Введіть назву вулиці"
            placeholder="Наприклад, Миру"
            value={selectedStreet}
            onChange={handleStreetChange}
            suggestions={streetsList}
          />
        </div>
      )}

      {/* Rural Step 4: House grid */}
      {!isCity && currentStep === 4 && (
        <div className={`${styles.houseGridSection} ${styles.fadeEntry}`}>
          <span className={styles.inputLabel}>Оберіть будинок</span>
          
          <div className={styles.inputWrapper} style={{ marginBottom: '8px' }}>
            <input
              type="text"
              value={houseSearchQuery}
              onChange={e => setHouseSearchQuery(e.target.value)}
              placeholder="Пошук або введення номера будинку..."
              className={styles.textInput}
            />
          </div>

          {filteredHousesList.length > 0 ? (
            <div className={styles.houseGrid}>
              {filteredHousesList.map(hNum => (
                <button
                  key={hNum}
                  onClick={() => handleHouseSelect(hNum)}
                  className={`${styles.houseChip} ${selectedHouse === hNum ? styles.houseChipActive : ''}`}
                >
                  {hNum}
                </button>
              ))}
            </div>
          ) : (
            houseSearchQuery.trim().length > 0 && (
              <div className={styles.missingHouseAlert}>
                <span className={styles.missingHouseText}>
                  Будинку № <strong>{houseSearchQuery}</strong> немає в списку для цієї вулиці.
                </span>
                <button
                  onClick={() => setIsMissingFormOpen(true)}
                  className={`${styles.capsuleBtn} ${styles.capsuleOrange}`}
                  style={{ minHeight: '44px', padding: '8px 16px', fontSize: '13px', marginTop: '6px' }}
                >
                  Повідомити про відсутній будинок
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* City Step 1: Street Autocomplete */}
      {isCity && currentStep === 1 && (
        <div className={styles.fadeEntry}>
          <AutoCompleteInput
            label="Введіть назву вулиці"
            placeholder="Наприклад, Миру"
            value={selectedStreet}
            onChange={handleStreetChange}
            suggestions={streetsList}
          />
        </div>
      )}

      {/* City Step 2: House grid */}
      {isCity && currentStep === 2 && (
        <div className={`${styles.houseGridSection} ${styles.fadeEntry}`}>
          <span className={styles.inputLabel}>Оберіть будинок</span>
          
          <div className={styles.inputWrapper} style={{ marginBottom: '8px' }}>
            <input
              type="text"
              value={houseSearchQuery}
              onChange={e => setHouseSearchQuery(e.target.value)}
              placeholder="Пошук або введення номера будинку..."
              className={styles.textInput}
            />
          </div>

          {filteredHousesList.length > 0 ? (
            <div className={styles.houseGrid}>
              {filteredHousesList.map(hNum => (
                <button
                  key={hNum}
                  onClick={() => handleHouseSelect(hNum)}
                  className={`${styles.houseChip} ${selectedHouse === hNum ? styles.houseChipActive : ''}`}
                >
                  {hNum}
                </button>
              ))}
            </div>
          ) : (
            houseSearchQuery.trim().length > 0 && (
              <div className={styles.missingHouseAlert}>
                <span className={styles.missingHouseText}>
                  Будинку № <strong>{houseSearchQuery}</strong> немає в списку для цієї вулиці.
                </span>
                <button
                  onClick={() => setIsMissingFormOpen(true)}
                  className={`${styles.capsuleBtn} ${styles.capsuleOrange}`}
                  style={{ minHeight: '44px', padding: '8px 16px', fontSize: '13px', marginTop: '6px' }}
                >
                  Повідомити про відсутній будинок
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.root}>
      {isSelectionComplete ? (
        <>
          {/* BLOCK 1: Уніфікована картка (Підчерга зліва + Адреса справа) */}
          {selectedHouse && foundSubGroupVal && (
            <div
              className={
                liveStatus?.isOn
                  ? styles.unifiedHeaderCardOrange
                  : styles.unifiedHeaderCardGray
              }
              style={{ animation: 'fadeIn 0.4s ease' }}
            >
              {/* Ліва частина: Номер підчерги або іконка уточнення */}
              <div className={styles.headerLeftPart}>
                {foundSubGroupVal === 'needs_clarification' ? (
                  <div className={styles.plaqueOuterFrameGray}>
                    <div className={styles.plaqueInnerCardGray}>
                      <HelpCircle size={28} className="text-zinc-400" />
                      <span className={styles.plaqueSubLabelGray} style={{ fontSize: '8px', marginTop: '1px' }}>
                        уточнення
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={
                      liveStatus?.isOn ? styles.plaqueOuterFrameOrange : styles.plaqueOuterFrameGray
                    }
                  >
                    <div
                      className={
                        liveStatus?.isOn ? styles.plaqueInnerCardOrange : styles.plaqueInnerCardGray
                      }
                    >
                      <span
                        className={`${styles.plaqueValue} ${
                          liveStatus?.isOn ? styles.plaqueValueOrange : styles.plaqueValueGray
                        }`}
                      >
                        {foundSubGroupVal}
                      </span>
                      <span
                        className={`${styles.plaqueSubLabel} ${
                          liveStatus?.isOn ? styles.plaqueSubLabelOrange : styles.plaqueSubLabelGray
                        }`}
                      >
                        підчерга
                      </span>
                    </div>
                    <div className={liveStatus?.isOn ? styles.plaquePillOrange : styles.plaquePillGray} />
                  </div>
                )}
              </div>

              {/* Права частина: Дані обраної адреси */}
              <div className={styles.headerRightPart}>
                {!isCity ? (
                  <>
                    <span className={styles.summaryLabel}>Обрана адреса</span>
                    <span className={styles.summaryDistrict}>
                      {cleanOkrug(selectedOkrug)} старостинський округ
                    </span>
                    <span className={styles.summaryVillage}>с. {selectedVillage}</span>
                    <span className={styles.summaryStreet}>
                      {selectedStreet}, буд. {selectedHouse}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={styles.summaryLabel}>Обрана адреса</span>
                    <span className={styles.summaryVillage}>м. Старокостянтинів</span>
                    <span className={styles.summaryStreet}>
                      {selectedStreet}, буд. {selectedHouse}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* BLOCK 2: Повідомлення про уточнення, якщо підчерга не визначена */}
          {selectedHouse && foundSubGroupVal === 'needs_clarification' && (
            <div className={styles.clarificationBanner} style={{ animation: 'fadeIn 0.4s ease' }}>
              <p className="text-xs text-zinc-500 leading-normal text-center">
                Ця адреса збережена, але її лінія електроживлення наразі уточнюється. Адміністратор додасть її найближчим часом.
              </p>
            </div>
          )}

          {/* BLOCK 3: Преміальний iOS-Style капсульний стек кнопок дій */}
          {selectedHouse && foundSubGroupVal && (
            <div className={styles.buttonStack} style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Дія 1: Показувати першою в додатку (Помаранчева капсула) */}
              <button
                onClick={handleSetStarterSubGroup}
                className={`${styles.capsuleBtn} ${styles.capsuleOrange}`}
              >
                Показувати цю підчергу першою в додатку
              </button>

              {/* Дія 2: Налаштувати пуш (Помаранчева капсула) або баннер входу для гостей */}
              {!isAnon ? (
                <button
                  onClick={handleSetupPush}
                  className={`${styles.capsuleBtn} ${styles.capsuleOrange}`}
                >
                  Налаштувати пуш-сповіщення для підчерги
                </button>
              ) : (
                <div className={styles.infoBanner}>
                  <span>
                    Хочете отримувати миттєві сповіщення про відключення?
                  </span>
                  <span>
                    <span
                      onClick={() => navigate('/cabinet')}
                      className={styles.infoBannerLink}
                    >
                      Увійдіть через Google
                    </span>{' '}
                    в особистому кабінеті, щоб налаштувати пуш-сповіщення.
                  </span>
                </div>
              )}

              {/* Дія 3: Зворотній зв'язок (Сіра капсула) */}
              <button
                onClick={() => setIsMissingFormOpen(true)}
                className={`${styles.capsuleBtn} ${styles.capsuleGray}`}
              >
                Повідомити про відсутню в базі адресу
              </button>

              {/* Дія 4: Скидання пошуку в корінь (Нейтральна сіра капсула) */}
              <button
                onClick={handleResetSearch}
                className={`${styles.capsuleBtn} ${styles.capsuleNeutral}`}
              >
                Почати новий пошук з самого початку
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* BLOCK 1: Address selection input form at the top */}
          {searchFormCard}
        </>
      )}

      {/* Standalone Action Buttons Stack on intermediate steps */}
      {!isSelectionComplete && currentStep > 1 && (
        <div className={styles.buttonStack} style={{ marginTop: '12px', animation: 'fadeIn 0.3s ease' }}>
          <button
            onClick={() => setIsMissingFormOpen(true)}
            className={`${styles.capsuleBtn} ${styles.capsuleGray}`}
          >
            Повідомити про відсутню в базі адресу
          </button>
          <button
            onClick={handleResetSearch}
            className={`${styles.capsuleBtn} ${styles.capsuleNeutral}`}
          >
            Почати новий пошук з самого початку
          </button>
        </div>
      )}

      {/* Missing Address Modal (BottomSheet) */}
      <MissingAddressForm
        isOpen={isMissingFormOpen}
        onClose={() => setIsMissingFormOpen(false)}
        staticData={{
          isCity,
          okrug: selectedOkrug,
          village: selectedVillage,
          street: selectedStreet,
          house: houseSearchQuery
        }}
        allExistingStreets={streetsList}
      />
    </div>
  );
};
