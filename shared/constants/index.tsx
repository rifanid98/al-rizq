
import { PrayerName } from '../types';

export const PRAYER_ORDER: PrayerName[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

export const PRAYER_COLORS: Record<PrayerName, string> = {
  Subuh: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  Dzuhur: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
  Ashar: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  Maghrib: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  Isya: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
};

export const PRAYER_RAKAAT: Record<PrayerName, number> = {
  Subuh: 2,
  Dzuhur: 4,
  Ashar: 4,
  Maghrib: 3,
  Isya: 4,
};

export const PRAYER_IMAGES: Record<PrayerName, string> = {
  Subuh: 'images/prayers/subuh.svg',
  Dzuhur: 'images/prayers/dzuhur.svg',
  Ashar: 'images/prayers/ashar.svg',
  Maghrib: 'images/prayers/maghrib.svg',
  Isya: 'images/prayers/isya.svg',
};

export const STORAGE_KEYS = {
  LOGS: 'al_rizq_logs',
  SCHEDULE: 'al_rizq_schedule',
  LOCATION_HISTORY: 'al_rizq_location_history',
  FASTING_LOGS: 'al_rizq_fasting_logs',
  CACHE_TIMESTAMP: 'al_rizq_cache_timestamp',
  LAST_UPDATED: 'al_rizq_last_updated',
  LAST_SYNC: 'al_rizq_last_sync',
  LOGS_BACKUP: 'al_rizq_logs_backup',
  ACTIVE_TAB: 'al_rizq_active_tab',
  APP_VERSION: 'al_rizq_version',
  NADZAR_CONFIG: 'al_rizq_nadzar_config',
  QADHA_CONFIG: 'al_rizq_qadha_config',
  DZIKIR_LOGS: 'al_rizq_dzikir_logs',
  LAST_KNOWN_LOCATION: 'al_rizq_last_location',
  GAMIFICATION_CONFIG: 'al_rizq_gamification_config',
  RAMADHAN_CONFIG: 'al_rizq_ramadhan_config'
};

export const CURRENT_VERSION = '1.1.0';
