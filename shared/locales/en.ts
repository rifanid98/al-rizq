
export const en = {
    common: {
        appName: "AL-RIZQ APP",
        premiumAccount: "Premium Account",
        version: "Version",
        logout: "Logout",
        back: "Back",
        save: "Save",
        cancel: "Cancel",
        loading: "Loading...",
        notLoggedIn: "Not Logged In",
        loginPrompt: "Log in to back up your data to the Cloud",
        backToToday: "Back to Today",
        today: "Today",
        date: "Date",
        time: "Time",
        location: "Location",
        showing: "Showing",
        deleteAll: "Delete All",
        yes: "Yes",
        no: "No",
        prev: "Prev",
        next: "Next",
        page: "Page",
        of: "of",
        noDataByDate: "No data for this date",
        prayer: "Prayer",
        statusLabel: "Status",
        change: "Change",
        menu: "Menu",
        confirmDeleteAll: "Are you sure you want to delete all history? This action cannot be undone.",
        errors: {
            geolocationDenied: "Location permission denied. Please search for location manually.",
            locationUnavailable: "Location unavailable.",
            timeout: "Location request timed out."
        },
        trackerCategory: "Worship Tracker"
    },
    tabs: {
        tracker: "Prayer",
        fasting: "Fasting",
        dashboard: "Dashboard",
        history: "History",
        settings: "Settings",
        dzikir: "Dhikr"
    },
    settings: {
        title: "Settings",
        profile: "User Profile",
        appearance: {
            title: "Appearance",
            subtitle: "Customize Interface",
            theme: "Theme",
            changeTheme: "Change",
            background: "Background", // Modified from "Prayer Background"
            bgDescription: "Show prayer time background", // New key
            backgroundSubtitle: "Show thematic images",
            opacity: "Opacity",
            clear: "Clear",
            overlay: "Overlay"
        },
        correction: { // New section
            title: 'Prayer Time Correction',
            description: 'Manually adjust prayer times if they differ from your local mosque.',
            global: 'Global Offset (All Prayers)',
            individual: 'Individual Correction',
            minutes: 'Minutes'
        },
        themes: {
            light: "Light",
            dark: "Dark",
            system: "System"
        },
        sync: {
            title: "Cloud Synchronization",
            subtitle: "Data Synchronization",
            lastSync: "Last Sync",
            notSynced: "Never",
            upload: "Upload to Cloud",
            download: "Download from Cloud",
            revert: "Revert Data",
            confirmReplace: "We found your backup data on the cloud. Do you want to replace local data with the cloud data?",
            useCloud: "Use Cloud Data",
            useLocal: "Keep Using This Device Data",
            restoring: "Restoring data...",
            syncing: "Synchronization in progress...",
            uploadSuccess: "Data uploaded successfully",
            downloadSuccess: "Data downloaded successfully",
            revertConfirm: "Reverting {source} will restore data to its previous state. Continue?"
        },
        language: {
            title: "Language",
            subtitle: "Choose application language",
            id: "Indonesian",
            en: "English"
        },
        additional: {
            title: "Miscellaneous",
            subtitle: "Other Settings",
            notifications: "Notifications",
            notificationsSubtitle: "Active (Kemenag Source)",
            privacy: "Privacy",
            privacySubtitle: "Local Data & Cloud Sync"
        }
    },
    dzikir: {
        title: "Dhikr",
        morning: "Morning",
        evening: "Evening",
        morningDesc: "Read after Dawn prayer until sunrise",
        eveningDesc: "Read after Afternoon prayer until sunset",
    },
    tracker: {
        title: "Prayer",
        location: "Location",
        searchLocation: "Search location...",
        locationHistory: "Location History",
        flashback: "Flashback",
        flashbackQuestion: "Forgot yesterday?",
        currentTime: "Current Time",
        flashbackActive: "Flashback Mode Active",
        showingScheduleFor: "Showing schedule for",
        prayerNames: {
            Subuh: "Dawn",
            Dzuhur: "Noon",
            Ashar: "Afternoon",
            Maghrib: "Sunset",
            Isya: "Night"
        },
        weather: {
            title: "Weather",
            clear: "Clear",
            rainy: "Rainy"
        },
        execution: {
            title: "Execution",
            atMosque: "Mosque",
            atHome: "Home",
            jamaah: "Jama'ah",
            munfarid: "Munfarid"
        },
        status: {
            ontime: "On Time",
            late: "Late",
            missed: "Missed"
        },
        markPrayer: "Mark Prayer",
        notTimeYet: "Not Time Yet",
        readyAt: "Ready at",
        markAs: "Mark As",
        forgotMarking: "Forgot to Mark",
        prayerDetails: "Prayer Details",
        scheduledTime: "Scheduled time",
        howManyRakaats: "How many rakaats missed?",
        additionalNotes: "Additional Notes (Optional)",
        qobliyah: "Sunnah Qobliyah",
        badiyah: "Sunnah Badiyah",
        dzikir: "Dhikr",
        dua: "Praying",
        masbuq: "Masbuq",
        latePrompt: "Example: long meeting, etc..."
    },
    celebration: {
        keepGoing: "keep up the good work!",
        quotes: [
            {
                title: "Maa Shaa Allah!",
                quote: "Seek help through patience and prayer.",
                source: "QS. Al-Baqarah: 45"
            },
            {
                title: "Tabarakallah!",
                quote: "Indeed, prayer prohibits immorality and wrongdoing.",
                source: "QS. Al-Ankabut: 45"
            },
            {
                title: "Alhamdulillah!",
                quote: "Successful indeed are the believers who are humble in their prayers.",
                source: "QS. Al-Mu'minun: 1-2"
            },
            {
                title: "Barakallah!",
                quote: "Maintain with care the [obligatory] prayers and [in particular] the middle prayer.",
                source: "QS. Al-Baqarah: 238"
            },
            {
                title: "Maa Shaa Allah!",
                quote: "Unquestionably, by the remembrance of Allah hearts are assured.",
                source: "QS. Ar-Ra'd: 28"
            },
            {
                title: "Subhanallah!",
                quote: "Establish prayer for My remembrance.",
                source: "QS. Thaha: 14"
            }
        ]
    },
    dashboard: {
        noData: "No Data Available",
        noDataSubtitle: "Start logging your prayers to see your reports here.",
        performance: "Worship Performance",
        performanceSubtitle: "Continue consistency for maximum results.",
        weeklyConsistency: "Weekly Consistency",
        sunnahStats: "Sunnah & Complementary Worship",
        dua: "Praying",
        masbuq: "Masbuq",
        masjidRate: "Masjid Rate",
        ontimeRate: "Ontime Rate",
        avgDelay: "Avg Delay",
        scrollToBottom: "Scroll to Bottom",
        status: {
            ontime: "On Time",
            late: "Late",
            missed: "Missed"
        },
        dzikirStats: "Dhikr Statistics",
        totalSessions: "Total Sessions",
        morning: "Morning",
        evening: "Evening",
        currentStreak: "Current Streak",
        days: "Days"
    },
    history: {
        title: "History",
        noLogs: "No prayer history yet.",
        notes: "Notes",
        activeFilter: "Active Filter",
        pickDate: "Pick a date"
    },
    fasting: {
        title: "Fasting Schedule",
        statsTitle: "Fasting",
        today: "Today",
        upcoming: "Upcoming",
        types: {
            monday: "Sunnah Monday Fasting",
            thursday: "Sunnah Thursday Fasting",
            mondayThursdayShort: "Mon & Thu",
            midMonth: "Ayyamul Bidh",
            ramadhan: "Ramadan",
            nadzar: "Vow (Nadzar)",
            qadha: "Makeup (Qadha)",
            forbidden: "Forbidden",
            other: "Other"
        },
        actions: {
            mark: "I'm Fasting",
            unmark: "Cancel Fasting",
            selectType: "Select Fasting Type",
            forbidden: "Fasting Not Allowed"
        },
        stats: {
            qadha: "Qadha/Debt",
            sunnah: "Sunnah Fasting",
            nadzar: "Vow",
            total: "Total Fasting",
            streak: "Streak"
        },
        distribution: "Fasting Distribution",
        history: "Monthly History",
        config: {
            title: "Fasting Settings",
            nadzar: "Vow (Nadzar)",
            qadha: "Makeup (Qadha)",
            computeAs: "Compute as {type} if:",
            specialDays: "Special days:",
            specialDates: "Special Dates:",
            resetTab: "Reset This Tab",
            saveConfig: "Save {type}",
            selectedDates: "{count} dates selected",
            selectOnCalendar: "Select date on calendar"
        },
        days: {
            sun: "SUN",
            mon: "MON",
            tue: "TUE",
            wed: "WED",
            thu: "THU",
            fri: "FRI",
            sat: "SAT"
        },
        months: {
            jan: "January",
            feb: "February",
            mar: "March",
            apr: "April",
            may: "May",
            jun: "June",
            jul: "July",
            aug: "August",
            sep: "September",
            oct: "October",
            nov: "November",
            dec: "December"
        },
        hijriMonths: {
            1: "Muharram",
            2: "Safar",
            3: "Rabi'ul Awal",
            4: "Rabi'ul Akhir",
            5: "Jumadil Awal",
            6: "Jumadil Akhir",
            7: "Rajab",
            8: "Sya'ban",
            9: "Ramadan",
            10: "Syawal",
            11: "Dzulkaidah",
            12: "Dzulhijjah"
        }
    },
    gamification: {
        title: "Gamification",
        level: "Level",
        xp: "XP",
        totalPoints: "Total Points",
        rank: {
            novice: "Novice",
            intermediate: "Intermediate",
            advanced: "Advanced",
            expert: "Expert",
            master: "Master"
        },
        settings: {
            title: "Gamification",
            active: "Gamification Active",
            disabled: "Gamification Disabled",
            pointsPrayer: "Prayer Points",
            pointsFasting: "Fasting Points",
            pointsDzikir: "Dhikr Points",
            pts: "Pts",
            keys: {
                mosque: "Mosque",
                jamaah: "Jamaah",
                noMasbuq: "No Masbuq",
                onTime: "On Time",
                qobliyah: "Qobliyah",
                badiyah: "Badiyah",
                dzikir: "Dhikr",
                dua: "Dua",
                bonusPerfect: "Perfect Bonus",
                bonusAllSunnah: "All Sunnah Bonus",
                mondayThursday: "Mon-Thu",
                ayyamulBidh: "Ayyamul Bidh",
                morningEvening: "Morning/Evening"
            }
        }
    }
};
