export type PrayerName = 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';
export type Language = 'id' | 'en';
export type FastingType = 'Senin-Kamis' | 'Ayyamul Bidh' | 'Ramadhan' | 'Nadzar' | 'Qadha' | 'Lainnya';

export interface PrayerTime {
  name: PrayerName;
  time: string; // HH:mm format
}

export interface PrayerLog {
  id: string;
  date: string; // YYYY-MM-DD
  prayerName: PrayerName;
  scheduledTime: string;
  actualTime: string;
  status: 'Tepat Waktu' | 'Terlambat' | 'Terlewat';
  delayMinutes: number;
  reason?: string; // Optional reason for being late
  isMasbuq?: boolean;
  masbuqRakaat?: number;
  locationType?: 'Rumah' | 'Masjid';
  executionType?: 'Jamaah' | 'Munfarid';
  weatherCondition?: 'Cerah' | 'Hujan';
  hasDzikir?: boolean;
  hasQobliyah?: boolean;
  hasBadiyah?: boolean;
  hasDua?: boolean;
}

export interface FastingPreferenceConfig {
  types: FastingType[];
  days: number[]; // 0-6, 0=Sunday
  customDates: string[];
  startDate?: string;
  endDate?: string;
}

export interface FastingLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: FastingType;
  isCompleted: boolean;
  notes?: string;
  isNadzar?: boolean;
  isQadha?: boolean;
}

export interface HijriDate {
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface DailySchedule {
  date: string;
  location: string;
  prayers: PrayerTime[];
  hijri?: HijriDate;
  sources?: { title: string; uri: string }[];
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  locationHistory: string[];
  showPrayerBg: boolean;
  prayerBgOpacity: number;
  language: Language;
  nadzarConfig?: FastingPreferenceConfig;
  qadhaConfig?: FastingPreferenceConfig;
  prayerTimeCorrection?: {
    global: number;
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  lastKnownLocation?: string;
  gamificationConfig?: GamificationConfig;
  ramadhanConfig?: {
    startDate: string;
    endDate: string;
  };
}

export interface AppState {
  logs: PrayerLog[];
  schedule: DailySchedule | null;
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
  isSyncing: boolean;
  settings: AppSettings;
}

export interface DzikirItem {
  id: string;
  title: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  count: number;
  note?: string;
  source?: string;
}

export interface DzikirCategory {
  id: string; // 'pagi', 'petang', 'custom'
  title: string;
  description?: string;
  items: DzikirItem[];
}

export interface DzikirLog {
  id: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  completedItems: string[]; // Array of DzikirItem IDs
  isCompleted: boolean;
  timestamp: number;
}

export interface GamificationPointsConfig {
  prayer: {
    mosque: number;
    jamaah: number;
    noMasbuq: number;
    onTime: number;
    qobliyah: number;
    badiyah: number;
    dzikir: number;
    dua: number; // "marked praying" mapped to Dua
    bonusPerfect: number; // Mosque + Jamaah + NoMasbuq + OnTime
    bonusAllSunnah: number; // Qobliyah + Badiyah + Dzikir + Dua
  };
  fasting: {
    ramadhan: number;
    mondayThursday: number; // Senin-Kamis
    ayyamulBidh: number;
    nadzar: number;
    qadha: number;
    other: number;
  };
  dzikir: {
    morningEvening: number; // Pagi/Petang
  };
}

export interface GamificationConfig {
  enabled: boolean;
  points: GamificationPointsConfig;
}

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  enabled: true,
  points: {
    prayer: {
      mosque: 5,
      jamaah: 5,
      noMasbuq: 5,
      onTime: 5,
      qobliyah: 5,
      badiyah: 5,
      dzikir: 5,
      dua: 5,
      bonusPerfect: 10,
      bonusAllSunnah: 10,
    },
    fasting: {
      ramadhan: 20,
      mondayThursday: 10,
      ayyamulBidh: 15,
      nadzar: 10,
      qadha: 10,
      other: 5,
    },
    dzikir: {
      morningEvening: 10,
    },
  },
};
