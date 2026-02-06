
import { SunnahPrayerItem, DailyHabitItem } from '../../../shared/types';

export const SUNNAH_PRAYERS: SunnahPrayerItem[] = [
    {
        id: 'dhuha',
        name: 'Shalat Dhuha',
        nameKey: 'sunnah.prayers.dhuha.name',
        minRakaat: 2,
        maxRakaat: 12,
        timeWindow: 'Setelah matahari terbit (+15 menit) hingga sebelum Dzuhur',
        timeWindowKey: 'sunnah.prayers.dhuha.timeWindow',
        description: 'Shalat sunnah yang dikerjakan pada waktu dhuha (pagi hari)',
        descriptionKey: 'sunnah.prayers.dhuha.description'
    },
    {
        id: 'tahajjud',
        name: 'Tahajjud',
        nameKey: 'sunnah.prayers.tahajjud.name',
        minRakaat: 2,
        maxRakaat: 11,
        timeWindow: 'Setelah Isya hingga sebelum Subuh (sepertiga malam terakhir)',
        timeWindowKey: 'sunnah.prayers.tahajjud.timeWindow',
        description: 'Shalat malam yang dikerjakan setelah tidur',
        descriptionKey: 'sunnah.prayers.tahajjud.description'
    },
    {
        id: 'witir',
        name: 'Witir',
        nameKey: 'sunnah.prayers.witir.name',
        minRakaat: 1,
        maxRakaat: 11,
        timeWindow: 'Setelah Isya hingga sebelum Subuh',
        timeWindowKey: 'sunnah.prayers.witir.timeWindow',
        description: 'Shalat sunnah dengan jumlah rakaat ganjil, penutup shalat malam',
        descriptionKey: 'sunnah.prayers.witir.description'
    }
];

export const DAILY_HABITS: DailyHabitItem[] = [
    {
        id: 'tilawah',
        name: 'Tilawah Al-Quran',
        nameKey: 'sunnah.habits.tilawah.name',
        type: 'counter',
        targetCount: 1,
        unit: 'halaman',
        unitKey: 'sunnah.habits.tilawah.unit',
        description: 'Membaca Al-Quran setiap hari',
        descriptionKey: 'sunnah.habits.tilawah.description'
    },
    {
        id: 'shalawat',
        name: 'Shalawat',
        nameKey: 'sunnah.habits.shalawat.name',
        type: 'counter',
        targetCount: 10,
        unit: 'kali',
        unitKey: 'sunnah.habits.shalawat.unit',
        description: 'Membaca shalawat kepada Nabi Muhammad ﷺ',
        descriptionKey: 'sunnah.habits.shalawat.description'
    },
    {
        id: 'sedekah',
        name: 'Sedekah',
        nameKey: 'sunnah.habits.sedekah.name',
        type: 'checkbox',
        description: 'Bersedekah setiap hari, sekecil apapun',
        descriptionKey: 'sunnah.habits.sedekah.description'
    },
    {
        id: 'doaTidur',
        name: 'Doa Tidur/Bangun',
        nameKey: 'sunnah.habits.doaTidur.name',
        type: 'checkbox',
        description: 'Membaca doa sebelum tidur dan setelah bangun tidur',
        descriptionKey: 'sunnah.habits.doaTidur.description'
    }
];
