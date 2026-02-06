
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
        trackerCategory: "Ibadah Tracker",
        activePeriod: "Periode Berlaku",
        start: "Mulai",
        end: "Selesai"
    },
    tabs: {
        tracker: "Sholat",
        fasting: "Puasa",
        dashboard: "Statistik",
        history: "Riwayat",
        achievements: "Capaian",
        settings: "Pengaturan",
        dzikir: "Dzikir",
        sunnah: "Sunnah"
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
        },
        dangerZone: {
            title: "Zona Berbahaya",
            clearData: "Hapus Semua Data",
            clearDataDesc: "Hapus semua log sholat, puasa, dzikir, dan pengaturan dari perangkat ini",
            confirmClear: "Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan."
        }
    },
    dzikir: {
        title: "Dzikir",
        morning: "Pagi",
        evening: "Petang",
        morningDesc: "Dibaca setelah sholat Subuh hingga terbit matahari",
        eveningDesc: "Dibaca setelah sholat Ashar hingga terbenam matahari",
    },
    sunnah: {
        tabs: {
            dzikir: "Dzikir",
            prayer: "Shalat",
            habit: "Ibadah"
        },
        prayers: {
            title: "Shalat Sunnah",
            subtitle: "Ibadah sunnah harian",
            dhuha: {
                name: "Shalat Dhuha",
                timeWindow: "Setelah matahari terbit (+15 menit) hingga sebelum Dzuhur",
                description: "Shalat sunnah yang dikerjakan pada waktu dhuha (pagi hari)"
            },
            tahajjud: {
                name: "Tahajjud",
                timeWindow: "Setelah Isya hingga sebelum Subuh (sepertiga malam terakhir)",
                description: "Shalat malam yang dikerjakan setelah tidur"
            },
            witir: {
                name: "Witir",
                timeWindow: "Setelah Isya hingga sebelum Subuh",
                description: "Shalat sunnah dengan jumlah rakaat ganjil, penutup shalat malam"
            }
        },
        habits: {
            title: "Ibadah Harian",
            subtitle: "Kebiasaan baik setiap hari",
            tilawah: {
                name: "Tilawah Al-Quran",
                unit: "halaman",
                description: "Membaca Al-Quran setiap hari"
            },
            shalawat: {
                name: "Shalawat",
                unit: "kali",
                description: "Membaca shalawat kepada Nabi Muhammad ﷺ"
            },
            sedekah: {
                name: "Sedekah",
                description: "Bersedekah setiap hari, sekecil apapun"
            },
            doaTidur: {
                name: "Doa Tidur/Bangun",
                description: "Membaca doa sebelum tidur dan setelah bangun tidur"
            }
        }
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
        sunnahStatsOverview: "Ringkasan lengkap aktivitas sunnah",
        totalSessions: "Total Sesi",
        morning: "Pagi",
        evening: "Petang",
        currentStreak: "Streak Hari Ini",
        days: "Hari",
        monthlyProgress: "Progress Bulanan",
        week: "Minggu",
        previousWeek: "Minggu Sebelumnya",
        peekLastWeek: "Lihat Minggu Lalu",
        showingPreviousWeek: "Menampilkan minggu terakhir bulan sebelumnya",
        dailyProgress: "Progress Harian",
        last7Days: "7 hari terakhir",
        weeklyTracking: "Pelacakan 4 minggu"
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
            ramadhanEnd: "Selesai Ramadhan",
            validityHint: "Atur tanggal mulai dan selesai untuk membatasi pengulangan jadwal puasa ini."
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
        current: "Sekarang",
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
        levels: {
            muslim: "Muslim (Pemula)",
            mukmin: "Mukmin (Beriman)",
            muhsin: "Muhsin (Baik)",
            muttaqin: "Muttaqin (Bertakwa)",
            siddiq: "Siddiq (Benar)"
        },
        badges: {
            collectionTitle: "Koleksi Badge",
            unlocking: "Membuka...",
            tier: "Tier",
            congratulations: "Selamat!",
            prayer: {
                ontime: {
                    title: "Sahabat Muadzin",
                    desc: "Sholat Tepat Waktu",
                    history: "Abdullah bin Mas'ud bertanya: 'Amalan apa yang paling dicintai Allah?' Rasulullah menjawab: 'Sholat pada waktunya'."
                },
                jamaah: {
                    title: "Pejuang Jamaah",
                    desc: "Sholat Berjamaah",
                    history: "Rasulullah bersabda: 'Shalat berjamaah lebih utama 27 derajat dibandingkan shalat sendirian'. (HR. Bukhari)"
                },
                mosque: {
                    title: "Jantung Masjid",
                    desc: "Sholat di Masjid",
                    history: "Seorang buta (Ibnu Ummi Maktum) tetap diperintahkan ke masjid jika mendengar adzan, menunjukkan pentingnya memakmurkan masjid."
                },
                sunnah: {
                    title: "Penjaga Sunnah",
                    desc: "Mengerjakan Sunnah Rawatib",
                    history: "Rasulullah bersabda: 'Barangsiapa shalat 12 rakaat sehari semalam, Allah akan bangunkan rumah di surga'. (HR. Muslim)"
                },
                subuh: {
                    title: "Pejuang Subuh",
                    desc: "Subuh Tepat Waktu",
                    history: "Dua rakaat fajar (sebelum Subuh) lebih baik daripada dunia dan seisinya. (HR. Muslim)"
                }
            },
            fasting: {
                monthu: {
                    title: "Senin Kamis",
                    desc: "Puasa Sunnah Rutin",
                    history: "Rasulullah bersabda: 'Amalan diperlihatkan pada hari Senin dan Kamis, aku ingin amalku diperlihatkan saat aku berpuasa'."
                },
                ayyamul: {
                    title: "Hari Putih",
                    desc: "Puasa Ayyamul Bidh",
                    history: "Wasiat Rasulullah kepada Abu Hurairah: 'Puasa tiga hari setiap bulan (Ayyamul Bidh) seperti puasa sepanjang masa'."
                },
                ramadhan: {
                    title: "Pahlawan Ramadhan",
                    desc: "Puasa Penuh Ramadhan",
                    history: "Perang Badar terjadi di bulan Ramadhan, membuktikan puasa bukan alasan untuk lemah, tapi sumber kekuatan ruhiyah."
                },
                qadha_annual: {
                    title: "Penakluk Qadha {year}",
                    desc: "Menyelesaikan seluruh utang puasa (Qadha) tahun {year}.",
                    history: "Aisyah RA biasa mengqadha puasa Ramadhan di bulan Sya'ban, menunjukkan kesungguhan menunaikan kewajiban sebelum Ramadhan berikutnya."
                }
            },
            dzikir: {
                morning: {
                    title: "Cahaya Pagi",
                    desc: "Dzikir Pagi",
                    history: "Allah berfirman: 'Dan bertasbihlah kepada-Nya di waktu pagi dan petang'. Para sahabat selalu memulai hari dengan dzikir."
                },
                evening: {
                    title: "Ketenangan Senja",
                    desc: "Dzikir Petang",
                    history: "Dzikir petang adalah benteng perlindungan seorang muslim dari kejahatan malam, seperti yang diajarkan Rasulullah."
                }
            },
            general: {
                istiqomah: {
                    title: "Master Istiqomah",
                    desc: "Login Berturut-turut",
                    history: "Rasulullah bersabda: 'Amalan yang paling dicintai Allah adalah yang dilakukan secara terus-menerus meskipun sedikit'."
                }
            }
        },
        settings: {
            title: "Gamifikasi",
            active: "Gamifikasi Aktif",
            disabled: "Gamifikasi Nonaktif",
            pointsPrayer: "Poin Sholat",
            pointsFasting: "Poin Puasa",
            pointsDzikir: "Poin Dzikir",
            pts: "Pts",
            pointsConfig: "Konfigurasi Poin",
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
                ramadhan: "Ramadhan",
                nadzar: "Nadzar",
                qadha: "Qadha",
                other: "Lainnya",
                morningEvening: "Pagi/Petang",
                dhuha: "Dhuha",
                tahajjud: "Tahajjud",
                witir: "Witir",
                tilawah: "Tilawah",
                shalawat: "Shalawat",
                sedekah: "Sedekah",
                doaTidur: "Doa Tidur"
            },
            pointsSunnahPrayer: "Poin Shalat Sunnah",
            pointsDailyHabit: "Poin Ibadah Harian"
        }
    }
};
