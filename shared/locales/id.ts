
export const id = {
    common: {
        appName: "AL-RIZQ APP",
        premiumAccount: "Akun Premium",
        version: "Versi",
        logout: "Keluar",
        back: "Kembali",
        save: "Simpan",
        cancel: "Batal",
        loading: "Memuat...",
        notLoggedIn: "Belum Masuk",
        loginPrompt: "Masuk untuk mencadangkan data Anda ke Cloud",
        backToToday: "Kembali ke Hari Ini",
        today: "Hari Ini",
        date: "Tanggal",
        time: "Waktu",
        location: "Lokasi",
        showing: "Menampilkan",
        deleteAll: "Hapus Semua",
        yes: "Ya",
        no: "Tidak",
        prev: "Sebelumnya",
        next: "Selanjutnya",
        page: "Halaman",
        of: "dari",
        noDataByDate: "Tidak ada data untuk tanggal ini",
        prayer: "Sholat",
        statusLabel: "Status",
        change: "Ubah",
        menu: "Menu",
        confirmDeleteAll: "Apakah Anda yakin ingin menghapus semua riwayat? Tindakan ini tidak dapat dibatalkan.",
        errors: {
            geolocationDenied: "Izin lokasi ditolak. Silakan cari lokasi secara manual.",
            locationUnavailable: "Lokasi tidak tersedia.",
            timeout: "Waktu pengambilan lokasi habis."
        },
        trackerCategory: "Ibadah Tracker"
    },
    tabs: {
        tracker: "Sholat",
        fasting: "Puasa",
        dashboard: "Statistik",
        history: "Riwayat",
        settings: "Pengaturan",
        dzikir: "Dzikir"
    },
    settings: {
        title: "Pengaturan",
        profile: "Profil Pengguna",
        appearance: {
            title: 'Tampilan',
            subtitle: 'Kustomisasi Antarmuka',
            theme: 'Tema',
            changeTheme: 'Ganti',
            background: 'Latar Belakang',
            bgDescription: 'Tampilkan background waktu sholat',
            backgroundSubtitle: 'Tampilkan gambar tematik',
            opacity: 'Opasitas',
            clear: 'Terang',
            overlay: 'Overlay'
        },
        correction: {
            title: 'Koreksi Waktu Sholat',
            description: 'Sesuaikan waktu sholat secara manual jika berbeda dengan masjid setempat.',
            global: 'Offset Global (Semua Sholat)',
            individual: 'Koreksi Per-Sholat',
            minutes: 'Menit'
        },
        themes: {
            light: "Terang",
            dark: "Gelap",
            system: "Sistem"
        },
        sync: {
            title: "Sinkronisasi Cloud",
            subtitle: "Sinkronisasi Data",
            lastSync: "Terakhir Sinkron",
            notSynced: "Belum Pernah",
            never: "Belum pernah sinkron",
            upload: "Upload ke Cloud",
            download: "Ambil dari Cloud",
            revert: "Kembalikan Data",
            confirmReplace: "Kami menemukan data cadangan Anda di cloud. Apakah Anda ingin mengganti data lokal dengan data cloud tersebut?",
            useCloud: "Gunakan Data Cloud",
            useLocal: "Tetap Gunakan Data Perangkat ini",
            restoring: "Mengembalikan data...",
            syncing: "Sinkronisasi sedang berjalan...",
            uploadSuccess: "Data berhasil diunggah",
            downloadSuccess: "Data berhasil diunduh",
            revertConfirm: "Membatalkan {source} akan mengembalikan data ke kondisi sebelumnya. Lanjutkan?"
        },
        language: {
            title: "Bahasa",
            subtitle: "Pilih bahasa aplikasi",
            id: "Bahasa Indonesia",
            en: "English"
        },
        additional: {
            title: "Lain-lain",
            subtitle: "Pengaturan Lainnya",
            notifications: "Notifikasi",
            notificationsSubtitle: "Aktif (Kemenag Source)",
            privacy: "Privasi",
            privacySubtitle: "Data Lokal & Cloud Sync"
        }
    },
    dzikir: {
        title: "Dzikir",
        morning: "Pagi",
        evening: "Petang",
        morningDesc: "Dibaca setelah sholat Subuh hingga terbit matahari",
        eveningDesc: "Dibaca setelah sholat Ashar hingga terbenam matahari",
    },
    tracker: {
        title: "Sholat",
        location: "Lokasi",
        searchLocation: "Cari lokasi...",
        locationHistory: "Riwayat Lokasi",
        flashback: "Flashback",
        flashbackQuestion: "Lupa Tandai Kemarin?",
        currentTime: "Waktu Sekarang",
        flashbackActive: "Mode Flashback Aktif",
        showingScheduleFor: "Menampilkan jadwal untuk",
        prayerNames: {
            Subuh: "Subuh",
            Dzuhur: "Dzuhur",
            Ashar: "Ashar",
            Maghrib: "Maghrib",
            Isya: "Isya"
        },
        weather: {
            title: "Cuaca",
            clear: "Cerah",
            rainy: "Hujan"
        },
        execution: {
            title: "Pelaksanaan",
            atMosque: "Masjid",
            atHome: "Rumah",
            jamaah: "Jama'ah",
            munfarid: "Munfarid"
        },
        status: {
            ontime: "Tepat Waktu",
            late: "Terlambat",
            missed: "Terlewat"
        },
        markPrayer: "Tandai Sholat",
        notTimeYet: "Belum Waktunya",
        readyAt: "Siap pada",
        markAs: "Tandai Sebagai",
        forgotMarking: "Lupa Tandai",
        prayerDetails: "Detail Sholat",
        scheduledTime: "Waktu jadwal",
        howManyRakaats: "Berapa rakaat yang tertinggal?",
        additionalNotes: "Catatan Tambahan (Opsional)",
        qobliyah: "Sunnah Qobliyah",
        badiyah: "Sunnah Ba'diyah",
        dzikir: "Dzikir",
        dua: "Berdoa",
        masbuq: "Masbuq",
        latePrompt: "Contoh: meeting panjang, dll..."
    },
    celebration: {
        keepGoing: "teruskan perjuanganmu!",
        quotes: [
            {
                title: "Maa Shaa Allah!",
                quote: "Jadikanlah sabar dan shalat sebagai penolongmu.",
                source: "QS. Al-Baqarah: 45"
            },
            {
                title: "Tabarakallah!",
                quote: "Sesungguhnya shalat itu mencegah perbuatan keji dan mungkar.",
                source: "QS. Al-Ankabut: 45"
            },
            {
                title: "Alhamdulillah!",
                quote: "Sungguh beruntung orang beriman yang khusyuk shalatnya.",
                source: "QS. Al-Mu'minun: 1-2"
            },
            {
                title: "Barakallah!",
                quote: "Peliharalah semua shalat(mu) dan shalat Wusta.",
                source: "QS. Al-Baqarah: 238"
            },
            {
                title: "Maa Shaa Allah!",
                quote: "Hanya dengan mengingat Allah hati menjadi tenteram.",
                source: "QS. Ar-Ra'd: 28"
            },
            {
                title: "Subhanallah!",
                quote: "Dirikanlah shalat untuk mengingat-Ku.",
                source: "QS. Thaha: 14"
            }
        ]
    },
    dashboard: {
        noData: "Belum Ada Data",
        noDataSubtitle: "Mulai catat sholatmu untuk melihat laporan di sini.",
        performance: "Performa Ibadah",
        performanceSubtitle: "Teruskan konsistensi untuk hasil yang maksimal.",
        weeklyConsistency: "Konsistensi Mingguan",
        sunnahStats: "Ibadah Sunnah & Pelengkap",
        dua: "Berdoa",
        masbuq: "Masbuq",
        masjidRate: "Laju Masjid",
        ontimeRate: "Laju Tepat Waktu",
        avgDelay: "Rata-rata Terlambat",
        scrollToBottom: "Gulir ke Bawah",
        status: {
            ontime: "Tepat Waktu",
            late: "Terlambat",
            missed: "Terlewat"
        },
        dzikirStats: "Statistik Ibadah Dzikir",
        totalSessions: "Total Sesi",
        morning: "Pagi",
        evening: "Petang",
        currentStreak: "Streak Hari Ini",
        days: "Hari"
    },
    history: {
        title: "Riwayat",
        noLogs: "Belum ada riwayat sholat.",
        notes: "Catatan",
        activeFilter: "Filter Aktif",
        pickDate: "Pilih Tanggal"
    },
    fasting: {
        title: "Pengaturan Puasa",
        statsTitle: "Puasa",
        today: "Hari Ini",
        upcoming: "Akan Datang",
        types: {
            monday: "Puasa Sunnah Senin",
            thursday: "Puasa Sunnah Kamis",
            mondayThursdayShort: "Senin & Kamis",
            midMonth: "Ayyamul Bidh",
            ramadhan: "Ramadhan",
            nadzar: "Nadzar",
            qadha: "Qadha",
            forbidden: "Diharamkan",
            other: "Lainnya"
        },
        actions: {
            mark: "Saya Puasa",
            unmark: "Batal Puasa",
            selectType: "Pilih Jenis Puasa",
            forbidden: "Tidak Boleh Puasa"
        },
        stats: {
            qadha: "Qadha/Hutang",
            sunnah: "Puasa Sunnah",
            nadzar: "Nadzar",
            total: "Total Puasa",
            streak: "Streak"
        },
        distribution: "Distribusi Puasa",
        history: "Riwayat Bulanan",
        config: {
            title: "Pengaturan Puasa",
            nadzar: "Nadzar",
            qadha: "Qadha / Hutang",
            computeAs: "Hitung sebagai {type} jika:",
            specialDays: "Hari-hari tertentu:",
            specialDates: "Tanggal Khusus:",
            resetTab: "Reset Tab Ini",
            saveConfig: "Simpan {type}",
            selectedDates: "{count} tanggal dipilih",
            selectOnCalendar: "Pilih tanggal di kalender",
            ramadhan: "Ramadhan",
            ramadhanStart: "Mulai Ramadhan",
            ramadhanEnd: "Selesai Ramadhan"
        },
        days: {
            sun: "Ahad",
            mon: "SEN",
            tue: "SEL",
            wed: "RAB",
            thu: "KAM",
            fri: "JUM",
            sat: "SAB"
        },
        months: {
            jan: "Januari",
            feb: "Februari",
            mar: "Maret",
            apr: "April",
            may: "Mei",
            jun: "Juni",
            jul: "Juli",
            aug: "Agustus",
            sep: "September",
            oct: "Oktober",
            nov: "November",
            dec: "Desember"
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
            9: "Ramadhan",
            10: "Syawal",
            11: "Dzulkaidah",
            12: "Dzulhijjah"
        }
    },
    gamification: {
        title: "Gamifikasi",
        level: "Level",
        xp: "XP",
        totalPoints: "Total Poin",
        rank: {
            novice: "Pemula",
            intermediate: "Menengah",
            advanced: "Mahir",
            expert: "Ahli",
            master: "Master"
        },
        settings: {
            title: "Gamifikasi",
            active: "Gamifikasi Aktif",
            disabled: "Gamifikasi Nonaktif",
            pointsPrayer: "Poin Sholat",
            pointsFasting: "Poin Puasa",
            pointsDzikir: "Poin Dzikir",
            pts: "Pts",
            keys: {
                mosque: "Masjid",
                jamaah: "Jamaah",
                noMasbuq: "Tidak Masbuq",
                onTime: "Tepat Waktu",
                qobliyah: "Qobliyah",
                badiyah: "Badiyah",
                dzikir: "Dzikir",
                dua: "Doa",
                bonusPerfect: "Bonus Sempurna",
                bonusAllSunnah: "Bonus Sunnah Lengkap",
                mondayThursday: "Senin-Kamis",
                ayyamulBidh: "Ayyamul Bidh",
                morningEvening: "Pagi/Petang"
            }
        }
    }
};
