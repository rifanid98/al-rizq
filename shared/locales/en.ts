
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
        achievements: "Achievements",
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
        title: "Fasting Settings",
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
            selectOnCalendar: "Select date on calendar",
            ramadhan: "Ramadan",
            ramadhanStart: "Ramadan Start",
            ramadhanEnd: "Ramadan End"
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
        levels: {
            muslim: "Muslim (Submitter)",
            mukmin: "Mukmin (Believer)",
            muhsin: "Muhsin (Excellent)",
            muttaqin: "Muttaqin (Pious)",
            siddiq: "Siddiq (Truthful)"
        },
        badges: {
            collectionTitle: "Badge Collection",
            prayer: {
                ontime: {
                    title: "Muadzin's Friend",
                    desc: "Prayer On Time",
                    history: "Abdullah bin Mas'ud asked: 'Which deed is most loved by Allah?' The Prophet replied: 'Prayer at its proper time'."
                },
                jamaah: {
                    title: "Jamaah Warrior",
                    desc: "Prayer in Congregation",
                    history: "The Prophet said: 'Prayer in congregation is 27 degrees better than prayer performed alone'. (HR. Bukhari)"
                },
                mosque: {
                    title: "Heart of Mosque",
                    desc: "Prayer at Mosque",
                    history: "Ibnu Ummi Maktum, despite being blind, was still commanded to go to the mosque if he heard the adhan, showing the importance of the mosque."
                },
                sunnah: {
                    title: "Sunnah Guardian",
                    desc: "Performed Sunnah Rawatib",
                    history: "The Prophet said: 'Whoever prays 12 rak'ahs in a day and night, Allah will build a house for him in Paradise'. (HR. Muslim)"
                },
                subuh: {
                    title: "Fajr Fighter",
                    desc: "Fajr On Time",
                    history: "The two rak'ahs of Fajr (Sunnah before Subuh) are better than this world and everything in it. (HR. Muslim)"
                }
            },
            fasting: {
                monthu: {
                    title: "Mon & Thu",
                    desc: "Routine Sunnah Fasting",
                    history: "The Prophet said: 'Actions are presented on Mondays and Thursdays, and I love that my actions are presented while I am fasting'."
                },
                ayyamul: {
                    title: "White Days",
                    desc: "Ayyamul Bidh Fasting",
                    history: "The Prophet's advice to Abu Hurairah: 'Fast three days every month (Ayyamul Bidh) as it is like fasting throughout the year'."
                },
                ramadhan: {
                    title: "Ramadhan Hero",
                    desc: "Full Ramadhan Fasting",
                    history: "The Battle of Badr took place in Ramadan, proving that fasting is not a reason for weakness, but a source of spiritual strength."
                },
                qadha_annual: {
                    title: "Debt Slayer {year}",
                    desc: "Completed {year} Qadha Fasting",
                    history: "Aisha RA used to make up missed Ramadan fasts in the month of Sha'ban, showing diligence in fulfilling obligations."
                },
                qadha: {
                    title: "Debt Slayer",
                    desc: "Paid Annual Qadha",
                    history: "Fulfilling a debt to Allah is more deserving of being paid off. (Hadith)"
                }
            },
            dzikir: {
                morning: {
                    title: "Morning Light",
                    desc: "Morning Dhikr",
                    history: "Allah says: 'And glorify Him morning and evening.' The Sahaba always started their day with remembrance."
                },
                evening: {
                    title: "Evening Peace",
                    desc: "Evening Dhikr",
                    history: "Evening Dhikr is a fortress for a Muslim against the evils of the night, as taught by the Messenger of Allah."
                }
            },
            general: {
                istiqomah: {
                    title: "Master Consistency",
                    desc: "Consecutive Logins",
                    history: "The Prophet said: 'The most beloved deeds to Allah are those done consistently, even if they are small'."
                }
            }
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
                bonusAllSunnah: "Full Sunnah Bonus",
                mondayThursday: "Mon-Thu",
                ayyamulBidh: "Ayyamul Bidh",
                ramadhan: "Ramadan",
                nadzar: "Nadzar",
                qadha: "Qadha",
                other: "Other",
                morningEvening: "Morning/Evening"
            }
        }
    }
};
