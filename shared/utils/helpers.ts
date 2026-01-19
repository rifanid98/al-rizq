
export const getCurrentTimeStr = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export const getLocalDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateForApi = (localDateStr: string) => {
  const [year, month, day] = localDateStr.split('-');
  return `${day}-${month}-${year}`;
};

export const calculateDelay = (scheduled: string, actual: string): number => {
  const [sH, sM] = scheduled.split(':').map(Number);
  const [aH, aM] = actual.split(':').map(Number);

  const scheduledMinutes = sH * 60 + sM;
  const actualMinutes = aH * 60 + aM;

  const diff = actualMinutes - scheduledMinutes;
  return diff > 0 ? diff : 0;
};

export const isLate = (scheduled: string, actual: string, gracePeriod = 15): boolean => {
  return calculateDelay(scheduled, actual) > gracePeriod;
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Ontime': return 'Tepat Waktu';
    case 'Late': return 'Terlambat';
    case 'Missed': return 'Terlewat';
    default: return status;
  }
};

export const isTimePassed = (scheduledTime: string, targetDateStr?: string): boolean => {
  const now = new Date();
  const [h, m] = scheduledTime.split(':').map(Number);

  // Use provided date or today's local date
  const dateStr = targetDateStr || getLocalDateStr();
  const [year, month, day] = dateStr.split('-').map(Number);

  const prayerDate = new Date(year, month - 1, day, h, m, 0, 0);
  return now >= prayerDate;
};

export const formatDate = (dateStr: string, locale: string = 'id-ID') => {
  if (!dateStr || dateStr === 'undefined') return '';
  try {
    // Split the YYYY-MM-DD and create a local date
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year)) return dateStr;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

// Cache Utilities
const CACHE_PREFIX = 'al_rizq_api_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const getCache = (key: string) => {
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed === 'object' && 'data' in parsed && 'expiry' in parsed) {
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.data;
    }
    // If it's not our cache format, clear it
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  } catch (e) {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
};

export const setCache = (key: string, data: any) => {
  const expiry = Date.now() + CACHE_EXPIRY;
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiry }));
};
