
// Mock LocalStorage
const STORAGE_KEYS = { RAMADHAN_CONFIG: 'ramadhan_config' };
const localStorageMock = {
    getItem: (key) => {
        if (key === STORAGE_KEYS.RAMADHAN_CONFIG) {
            return JSON.stringify({
                startDate: '2026-02-20', // Approx start
                endDate: '2026-03-21'    // User specified end date
            });
        }
        return null;
    }
};

// Mock Intl
const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umedqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
});

// The logic under test
const getHijriDate = (date) => {
    let manualOffset = 0;
    try {
        const savedRamadhan = localStorageMock.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
        if (savedRamadhan) {
            const { endDate } = JSON.parse(savedRamadhan);
            if (endDate) {
                const manualEid = new Date(endDate);
                manualEid.setDate(manualEid.getDate() + 1); // Mar 22

                // Check standard hijri for Mar 22
                const testParts = hijriFormatter.formatToParts(manualEid);
                const tMonth = parseInt(testParts.find(p => p.type === "month")?.value || "1");
                const tDay = parseInt(testParts.find(p => p.type === "day")?.value || "1");

                console.log(`Manual Eid (Mar 22) Standard Hijri: Month=${tMonth}, Day=${tDay}`);

                if (tMonth === 9) {
                    manualOffset = (30 - tDay) + 1;
                } else if (tMonth === 10) {
                    manualOffset = 1 - tDay;
                } else if (tMonth === 8) {
                    manualOffset = 30; // Fallback
                }
                console.log(`Calculated Manual Offset: ${manualOffset}`);
            }
        }
    } catch (e) { console.error(e); }

    let targetDate = new Date(date);
    targetDate.setDate(date.getDate() + manualOffset);

    const parts = hijriFormatter.formatToParts(targetDate);
    const day = parts.find(p => p.type === "day")?.value || "";
    const month = parseInt(parts.find(p => p.type === "month")?.value || "1");
    const year = parts.find(p => p.type === "year")?.value || "";

    return { day: parseInt(day), month, year };
};

// Scan May and June 2026
console.log("Scanning May/June 2026 for 10 Dzulhijjah (Month 12)...");
for (let m = 4; m <= 5; m++) { // Month 4=May, 5=June
    for (let d = 1; d <= 31; d++) {
        const date = new Date(2026, m, d);
        if (date.getMonth() !== m) continue; // Skip invalid dates

        const h = getHijriDate(date);
        if (h.month === 12 && h.day === 10) {
            console.log(`FOUND Eid al-Adha (10 Dzulhijjah) on: ${date.toDateString()}`);
        }
        // Also check Tasyrik
        if (h.month === 12 && [11, 12, 13].includes(h.day)) {
            console.log(`FOUND Tasyrik (${h.day} Dzulhijjah) on: ${date.toDateString()}`);
        }
    }
}
