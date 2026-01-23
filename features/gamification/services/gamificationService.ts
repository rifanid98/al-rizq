
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

export const calculatePrayerPoints = (log: PrayerLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled) return 0;
    if (log.status === 'Terlewat') return 0;

    const p = config.points.prayer;
    let points = 0;
    const breakdown: Record<string, number> = {};

    // Rule 1: Mark Prayer -> 0 Base Points (as requested)

    // Status Check
    // "Tepat Waktu" includes "Forgot to mark" which defaults to on-time for scoring purposes.
    const isOnTime = log.status === 'Tepat Waktu' || (log as any).status === 'Ontime';

    // Rule 2: Mosque
    const isMosque = log.locationType === 'Masjid';
    if (isMosque) {
        const val = (p.mosque || 0);
        points += val;
        if (val > 0) breakdown['Mosque'] = val;
    }

    // Rule 3: Jama'ah
    const isJamaah = log.executionType === 'Jamaah';
    if (isJamaah) {
        const val = (p.jamaah || 0);
        points += val;
        if (val > 0) breakdown['Jamaah'] = val;
    }

    // Rule 4: No Masbuq
    // Logic: No Masbuq points are only relevant for Jama'ah. 
    // If Munfarid, this reward is cancelled.
    const isNoMasbuq = !log.isMasbuq && isJamaah;
    if (isNoMasbuq) {
        const val = (p.noMasbuq || 0);
        points += val;
        if (val > 0) breakdown['No Masbuq'] = val;
    }

    // Rule 5: Sunnah & Complementary
    if (log.hasQobliyah) {
        const val = (p.qobliyah || 0);
        points += val;
        if (val > 0) breakdown['Qobliyah'] = val;
    }
    if (log.hasBadiyah) {
        const val = (p.badiyah || 0);
        points += val;
        if (val > 0) breakdown['Badiyah'] = val;
    }
    if (log.hasDzikir) {
        const val = (p.dzikir || 0);
        points += val;
        if (val > 0) breakdown['Dzikir'] = val;
    }
    if (log.hasDua) {
        const val = (p.dua || 0);
        points += val;
        if (val > 0) breakdown['Dua'] = val;
    }

    // Rule 6: On Time
    if (isOnTime) {
        const val = (p.onTime || 0);
        points += val;
        if (val > 0) breakdown['On Time'] = val;
    }

    // --- Bonuses ---

    // Extended Rule 1: Perfect Prayer Bonus
    // Criteria: Rule 2 (Mosque) + Rule 3 (Jama'ah) + Rule 4 (No Masbuq) + On Time
    if (isMosque && isJamaah && isNoMasbuq && isOnTime) {
        const val = (p.bonusPerfect || 0);
        points += val;
        if (val > 0) breakdown['Bonus Perfect'] = val;
    }

    // Extended Rule 2: All Sunnah Bonus
    // Criteria: Qobliyah + Dzikir + Dua + (Badiyah if applicable)
    // Exception: Subuh & Ashar do not have Badiyah.
    const isBadiyahApplicable = !['Subuh', 'Ashar'].includes(log.prayerName);
    const hasCoreSunnah = log.hasQobliyah && log.hasDzikir && log.hasDua;
    const hasBadiyahRequirement = isBadiyahApplicable ? log.hasBadiyah : true;

    if (hasCoreSunnah && hasBadiyahRequirement) {
        const val = (p.bonusAllSunnah || 0);
        points += val;
        if (val > 0) breakdown['Bonus All Sunnah'] = val;
    }

    if (points > 0) {
        console.log(`[Points Debug] ${log.prayerName}:`, breakdown, `Total: ${points}`);
    }

    return points;
};

export const calculateFastingPoints = (log: FastingLog, config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG): number => {
    if (!config.enabled || !log.isCompleted) return 0;

    const p = config.points.fasting;
    let points = 0;
    if (log.type === 'Senin-Kamis') points = p.mondayThursday || 0;
    else if (log.type === 'Ayyamul Bidh') points = p.ayyamulBidh || 0;
    else if (log.type === 'Ramadhan') points = p.ramadhan || 0;
    else if (log.type === 'Nadzar') points = p.nadzar || 0;
    else if (log.type === 'Qadha') points = p.qadha || 0;
    else points = p.other || 0;

    // Additional points for specific flags if type wasn't already the same
    if (log.isNadzar && log.type !== 'Nadzar') points = Math.max(points, p.nadzar || 0);
    if (log.isQadha && log.type !== 'Qadha') points = Math.max(points, p.qadha || 0);

    return points;
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
