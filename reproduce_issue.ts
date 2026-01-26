
import { isProhibitedFastingDay, getHijriDate, PROHIBITED_DAYS } from './features/fasting/services/fastingService';
import { STORAGE_KEYS } from './shared/constants';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => store[key] = value.toString(),
        clear: () => store = {}
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Helpers
const check = (dateStr: string, label: string) => {
    const d = new Date(dateStr);
    const hijri = getHijriDate(d);
    const isProhibited = isProhibitedFastingDay(hijri, d);
    console.log(`${dateStr} (Hijri: ${hijri.day}-${hijri.month.number}): isProhibited=${isProhibited} [Expected for ${label}]`);
};

// 1. Test Standard Eid al-Adha (approx Jun 17, 2024 is 10 Dzulhijjah 1445)
// Let's find a date that maps to 10 Dzulhijjah.
// Since getHijriDate uses Intl, it depends on system. 
// We will iterate June 2024 to find 10 Dzulhijjah.

console.log('--- Scanning for Standard Eid al-Adha (Month 12, Day 10) ---');
let foundAdha = false;
for (let i = 1; i <= 30; i++) {
    const d = new Date(2024, 5, i); // June 2024
    const h = getHijriDate(d);
    if (h.month.number === 12 && parseInt(h.day) === 10) {
        console.log(`Found 10 Dzulhijjah on: ${d.toDateString()}`);
        const isP = isProhibitedFastingDay(h, d);
        console.log(`> isProhibited: ${isP}`);
        foundAdha = true;
    }
}
if (!foundAdha) console.log('Could not find 10 Dzulhijjah in June 2024 scan.');

// 2. Set Manual Ramadan and Scan Again
console.log('\n--- Setting Manual Ramadan and Rescanning ---');
localStorage.setItem(STORAGE_KEYS.RAMADHAN_CONFIG, JSON.stringify({
    startDate: '2024-03-11',
    endDate: '2024-04-09' // Eid Fitri should be April 10
}));

// Scan for Eid al-Adha again to see if it disappeared
foundAdha = false;
for (let i = 1; i <= 30; i++) {
    const d = new Date(2024, 5, i); // June 2024
    const h = getHijriDate(d);
    if (h.month.number === 12 && parseInt(h.day) === 10) {
        console.log(`Found 10 Dzulhijjah on: ${d.toDateString()}`);
        const isP = isProhibitedFastingDay(h, d);
        console.log(`> isProhibited: ${isP}`);
        if (!isP) console.error('FAIL: Eid al-Adha suppressed by Manual Ramadan config!');
        else console.log('PASS: Eid al-Adha active.');
        foundAdha = true;
    }
}

// 3. Test Manual Eid Al-Fitr
console.log('\n--- Testing Manual Eid Al-Fitr ---');
const manualEid = new Date('2024-04-10'); // Day after EndDate
const hFitr = getHijriDate(manualEid);
console.log(`Manual Eid (Apr 10): isProhibited=${isProhibitedFastingDay(hFitr, manualEid)}`);

