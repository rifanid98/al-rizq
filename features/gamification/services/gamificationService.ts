
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

    if (isMosque) points += (p.mosque || 0);
    if (isJamaah) points += (p.jamaah || 0);
    if (isNoMasbuq) points += (p.noMasbuq || 0);
    if (isOnTime) points += (p.onTime || 0);

    // Sunnah & Complementary
    if (log.hasQobliyah) points += (p.qobliyah || 0);
    if (log.hasBadiyah) points += (p.badiyah || 0);
    if (log.hasDzikir) points += (p.dzikir || 0);
    if (log.hasDua) points += (p.dua || 0);

    // Bonuses
    // Perfect: Mosque + Jamaah + NoMasbuq + OnTime
    if (isMosque && isJamaah && isNoMasbuq && isOnTime) {
        points += (p.bonusPerfect || 0);
    }

    // All Sunnah: Qobliyah + Badiyah + Dzikir + Dua
    // Fixed: Subuh & Ashar do not have Badiyah, so we shouldn't require it.
    const isBadiyahApplicable = !['Subuh', 'Ashar'].includes(log.prayerName);

    // Requirement:
    // 1. Must have Qobliyah, Dzikir, and Dua
    // 2. IF Badiyah is applicable, must have Badiyah.
    const hasCoreSunnah = log.hasQobliyah && log.hasDzikir && log.hasDua;
    const hasBadiyahRequirement = isBadiyahApplicable ? log.hasBadiyah : true;

    if (hasCoreSunnah && hasBadiyahRequirement) {
        points += (p.bonusAllSunnah || 0);
    }

    return points;
};

export const calculateFastingPoints = (log: FastingLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled || !log.isCompleted) return 0;

    const p = config.points.fasting;
    if (log.type === 'Senin-Kamis') return p.mondayThursday || 0;
    if (log.type === 'Ayyamul Bidh') return p.ayyamulBidh || 0;
    if (log.type === 'Ramadhan') return p.ramadhan || 0;
    if (log.type === 'Nadzar') return p.nadzar || 0;
    if (log.type === 'Qadha') return p.qadha || 0;
    if (log.type === 'Lainnya') return p.other || 0;

    return 0;
};

export const calculateDzikirPoints = (log: DzikirLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled || !log.isCompleted) return 0;

    const p = config.points.dzikir;
    // Check category
    if (log.categoryId === 'pagi' || log.categoryId === 'petang') {
        return p.morningEvening || 0;
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
