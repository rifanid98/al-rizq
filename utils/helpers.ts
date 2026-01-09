
export const getCurrentTimeStr = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export const calculateDelay = (scheduled: string, actual: string): number => {
  const [sH, sM] = scheduled.split(':').map(Number);
  const [aH, aM] = actual.split(':').map(Number);
  
  const scheduledMinutes = sH * 60 + sM;
  const actualMinutes = aH * 60 + aM;
  
  // If actual is before scheduled (unlikely for a late check, but possible if checking in early)
  const diff = actualMinutes - scheduledMinutes;
  return diff > 0 ? diff : 0;
};

export const isLate = (scheduled: string, actual: string, gracePeriod = 15): boolean => {
  return calculateDelay(scheduled, actual) > gracePeriod;
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
