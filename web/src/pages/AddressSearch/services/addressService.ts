export interface HouseData {
  [houseNumber: string]: string; // houseNumber -> queueName (e.g. "1.1" or "needs_clarification")
}

export interface StreetData {
  [streetName: string]: HouseData;
}

export interface VillageData {
  [villageName: string]: {
    streets: StreetData;
  };
}

export interface OkrugData {
  [okrugName: string]: {
    villages: VillageData;
  };
}

export interface RegistryData {
  Місто: {
    [cityName: string]: StreetData;
  };
  [okrugName: string]: any; // Okrugs
}

// Dynamic address loader
export const loadAddressRegistry = async (): Promise<RegistryData> => {
  // Uses Vite dynamic import or simple fetch
  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}src/pages/AddressSearch/data/starokost_addresses.json?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error("Не вдалося завантажити базу адрес");
  }
  return response.json();
};

// Natural sorting algorithm for house numbers (e.g., "1", "2/1", "2-А", "10")
export const naturalSortHouses = (houses: string[]): string[] => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return [...houses].sort((a, b) => collator.compare(a, b));
};

// Get all unique Starostynskyi Okrugs from the database
export const getOkrugs = (data: RegistryData): string[] => {
  return Object.keys(data).filter(key => key !== 'Місто');
};

// Get all villages in a given Okrug
export const getVillages = (data: RegistryData, okrug: string): string[] => {
  const okrugData = data[okrug];
  if (!okrugData) return [];
  return Object.keys(okrugData);
};

// Get all streets for a given settlement (City or specific Village)
export const getStreets = (
  data: RegistryData,
  isCity: boolean,
  okrug?: string,
  village?: string
): string[] => {
  if (isCity) {
    const cityData = data['Місто']?.['Старокостянтинів'];
    return cityData ? Object.keys(cityData).sort() : [];
  } else {
    if (!okrug || !village) return [];
    const villageData = data[okrug]?.[village];
    return villageData ? Object.keys(villageData).sort() : [];
  }
};

// Get all houses for a given street and settlement
export const getHouses = (
  data: RegistryData,
  isCity: boolean,
  street: string,
  okrug?: string,
  village?: string
): string[] => {
  let housesObj: HouseData | undefined;

  if (isCity) {
    housesObj = data['Місто']?.['Старокостянтинів']?.[street];
  } else {
    if (!okrug || !village) return [];
    housesObj = data[okrug]?.[village]?.[street];
  }

  if (!housesObj) return [];
  return naturalSortHouses(Object.keys(housesObj));
};

// Find subgroup for a selected address
export const findSubGroup = (
  data: RegistryData,
  isCity: boolean,
  street: string,
  house: string,
  okrug?: string,
  village?: string
): string | null => {
  let housesObj: HouseData | undefined;

  if (isCity) {
    housesObj = data['Місто']?.['Старокостянтинів']?.[street];
  } else {
    if (!okrug || !village) return null;
    housesObj = data[okrug]?.[village]?.[street];
  }

  return housesObj ? (housesObj[house] || null) : null;
};
