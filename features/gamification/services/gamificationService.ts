
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

export const calculatePrayerPoints = (log: PrayerLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled) return 0;
    if (log.status === 'Terlewat') return 0;

    const p = config.points.prayer;
    let points = 0;

    // Single Criteria
    const isMosque = log.locationType === 'Masjid';
    const isJamaah = log.executionType === 'Jamaah';
    const isNoMasbuq = !log.isMasbuq;
    // Check if status implies "On Time". 
    // In `types/index.ts`: status: 'Tepat Waktu' | 'Terlambat' | 'Terlewat';
    // Note: PrayerCard.tsx checks: `loggedToday.status === 'Tepat Waktu' || loggedToday.status === 'Ontime'`
    // Ideally standardize, but we'll check broadly.
    const isOnTime = log.status === 'Tepat Waktu' || (log as any).status === 'Ontime';

    if (isMosque) points += p.mosque;
    if (isJamaah) points += p.jamaah;
    if (isNoMasbuq) points += p.noMasbuq;
    if (isOnTime) points += p.onTime;

    // Sunnah & Complementary
    if (log.hasQobliyah) points += p.qobliyah;
    if (log.hasBadiyah) points += p.badiyah;
    if (log.hasDzikir) points += p.dzikir;
    if (log.hasDua) points += p.dua;

    // Bonuses
    // Perfect: Mosque + Jamaah + NoMasbuq + OnTime
    if (isMosque && isJamaah && isNoMasbuq && isOnTime) {
        points += p.bonusPerfect;
    }

    // All Sunnah: Qobliyah + Badiyah + Dzikir + Dua
    // Note: Some prayers might not *have* Qobliyah/Badiyah (e.g. Subuh no badiyah, Ashar no badiyah).
    // Ideally, we should check if they are *applicable*.
    // However, simpler logic: if the user checked ALL boxes available in the UI.
    // Can we know which ones were available?
    // User request: "marked all sunnah & complementary worship +10 bonus".
    // If the user marks `hasQobliyah`=true, `hasBadiyah`=true, `hasDzikir`=true, `hasDua`=true.
    // If a prayer doesn't have Badiyah (like Subuh), presumably the user CANNOT check it?
    // Let's assume the UI handles availability or the user just checks what they did.
    // For strict fairness, if they checked all 4, they get the bonus.
    if (log.hasQobliyah && log.hasBadiyah && log.hasDzikir && log.hasDua) {
        points += p.bonusAllSunnah;
    }

    return points;
};

export const calculateFastingPoints = (log: FastingLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled || !log.isCompleted) return 0;

    const p = config.points.fasting;
    if (log.type === 'Senin-Kamis') return p.mondayThursday;
    if (log.type === 'Ayyamul Bidh') return p.ayyamulBidh;

    return 0;
};

export const calculateDzikirPoints = (log: DzikirLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled || !log.isCompleted) return 0;

    const p = config.points.dzikir;
    // Check category
    if (log.categoryId === 'pagi' || log.categoryId === 'petang') {
        return p.morningEvening;
    }

    return 0;
};

export const getLevel = (totalPoints: number): { level: number; progress: number; currentLevelXp: number; nextLevelXp: number } => {
    // Simple Level System: Level N needs N * 100 XP? Or quadratic?
    // Let's use a standard RPG curve: Points = Level^2 * Constant.
    // Or linear for simplicity: Level 1 = 0-500, Level 2 = 501-1500...
    // Let's stick to a simple formula: Level = floor(sqrt(points / 25)) + 1
    // If points = 0 -> sq(0)=0 -> Lvl 1
    // If points = 100 -> sq(4)=2 -> Lvl 3 (Maybe too fast?)
    // Let's try Level = floor(points / 500) + 1.
    // 0 -> Lvl 1. 500 -> Lvl 2. 
    // With points like +5, +5, +10... a good day might give 5 prayers * ~50pts = 250pts.
    // So everyday you gain ~0.5 level? That feels rewarding.

    const XP_PER_LEVEL = 500;
    const level = Math.floor(totalPoints / XP_PER_LEVEL) + 1;
    const currentLevelXp = totalPoints % XP_PER_LEVEL;
    const nextLevelXp = XP_PER_LEVEL;
    const progress = (currentLevelXp / nextLevelXp) * 100;

    return { level, progress, currentLevelXp, nextLevelXp };
};
