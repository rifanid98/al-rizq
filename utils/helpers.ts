
export const getCurrentTimeStr = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
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

export const isTimePassed = (scheduledTime: string): boolean => {
  const now = new Date();
  const [h, m] = scheduledTime.split(':').map(Number);
  const prayerDate = new Date();
  prayerDate.setHours(h, m, 0, 0);
  return now >= prayerDate;
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
