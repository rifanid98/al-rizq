
export type PrayerName = 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';

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

export interface DailySchedule {
  date: string;
  location: string;
  prayers: PrayerTime[];
  sources?: { title: string; uri: string }[];
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface AppState {
  logs: PrayerLog[];
  schedule: DailySchedule | null;
  location: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
  isSyncing: boolean;
}
