import { Kajian, MudzakarahTopic } from "@/types";

// Semua pekan dijabarkan terpisah — tidak ada penggabungan "Pekan X & Y"
export const DUMMY_KAJIAN: Kajian[] = [
  // ── SELASA ──────────────────────────────────────────────────────────────
  {
    id: "r1",
    judul: "Perhiasan Penuntut Ilmu",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "(masih konfirmasi)",
    hari: "Selasa · Pekan 2",
    lokasi: "Masjid an-Nahl Palm Hills",
    alamat: "Masjid an-Nahl Palm Hills",
    status: "akan_datang",
    kategori: "Ilmu",
    deskripsi:
      "Kajian tentang adab dan perhiasan seorang penuntut ilmu bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Jadwal masih konfirmasi.",
  },
  {
    id: "r2",
    judul: "Keutamaan Islam",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "(masih konfirmasi)",
    hari: "Selasa · Pekan 4",
    lokasi: "Masjid an-Nahl Palm Hills",
    alamat: "Masjid an-Nahl Palm Hills",
    status: "akan_datang",
    kategori: "Akidah",
    deskripsi:
      "Kajian tentang keutamaan-keutamaan agama Islam bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Jadwal masih konfirmasi.",
  },

  // ── RABU ────────────────────────────────────────────────────────────────
  {
    id: "r3a",
    judul: "Fiqih Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "15.45 - 17.30 WIB",
    hari: "Rabu · Pekan 1",
    lokasi: "Metro Mediterania",
    alamat: "Metro Mediterania",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian fikih khusus untuk wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum fikih yang berkaitan dengan wanita muslimah.",
  },
  {
    id: "r3b",
    judul: "Fiqih Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "15.45 - 17.30 WIB",
    hari: "Rabu · Pekan 3",
    lokasi: "Metro Mediterania",
    alamat: "Metro Mediterania",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian fikih khusus untuk wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum fikih yang berkaitan dengan wanita muslimah.",
  },
  {
    id: "r4",
    judul: "Fadhlul Islam",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Rabu · Pekan 2",
    lokasi: "Masjid Imam an-Nawawi",
    alamat: "Masjid Imam an-Nawawi",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian kitab Fadhlul Islam bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas keutamaan dan keistimewaan agama Islam.",
  },

  // ── KAMIS ───────────────────────────────────────────────────────────────
  {
    id: "r5",
    judul: "Fiqih Asmaul Husna",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.15 WIB",
    hari: "Kamis · Pekan 1",
    lokasi: "Masjid Abu Bakar ash-Shiddiq",
    alamat: "Masjid Abu Bakar ash-Shiddiq",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian Fiqih Asmaul Husna bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas nama-nama Allah yang indah dan implikasinya dalam kehidupan.",
  },
  {
    id: "r6",
    judul: "Kitabut Tauhid",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.15 WIB",
    hari: "Kamis · Pekan 2",
    lokasi: "Masjid Abu Bakar ash-Shiddiq",
    alamat: "Masjid Abu Bakar ash-Shiddiq",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian Kitabut Tauhid karya Syaikh Muhammad bin Abdul Wahhab bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },

  // ── JUMAT ───────────────────────────────────────────────────────────────
  {
    id: "r7a",
    judul: "Fiqih Haid",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Jumat · Pekan 2",
    lokasi: "Zircon Villa Permata Hijau",
    alamat: "Zircon Villa Permata Hijau",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian Fiqih Haid bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum seputar haid yang wajib diketahui setiap muslimah.",
  },
  {
    id: "r7b",
    judul: "Fiqih Haid",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Jumat · Pekan 4",
    lokasi: "Zircon Villa Permata Hijau",
    alamat: "Zircon Villa Permata Hijau",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian Fiqih Haid bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum seputar haid yang wajib diketahui setiap muslimah.",
  },
  {
    id: "r8",
    judul: "Kajian Jumat Pekan 4",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "(masih konfirmasi)",
    hari: "Jumat · Pekan 4",
    lokasi: "Masjid as-Salam GSI",
    alamat: "Masjid as-Salam GSI",
    status: "akan_datang",
    kategori: "Umum",
    deskripsi:
      "Kajian rutin bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله di Masjid as-Salam GSI. Jadwal dan topik masih konfirmasi.",
  },

  // ── SABTU ───────────────────────────────────────────────────────────────
  {
    id: "r9a",
    judul: "Hilyah Thalibul 'Ilmi & al-Firqotun Naiyah",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "09.30 - selesai",
    hari: "Sabtu · Pekan 1",
    lokasi: "Masjid Imam asy-Syafi'i",
    alamat: "Masjid Imam asy-Syafi'i",
    status: "aktif",
    kategori: "Ilmu",
    deskripsi:
      "Kajian Hilyah Thalibul 'Ilmi dan kitab al-Firqotun Naiyah bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r9b",
    judul: "Hilyah Thalibul 'Ilmi & al-Firqotun Naiyah",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "09.30 - selesai",
    hari: "Sabtu · Pekan 3",
    lokasi: "Masjid Imam asy-Syafi'i",
    alamat: "Masjid Imam asy-Syafi'i",
    status: "aktif",
    kategori: "Ilmu",
    deskripsi:
      "Kajian Hilyah Thalibul 'Ilmi dan kitab al-Firqotun Naiyah bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r10a",
    judul: "100 Dosa yang Diremehkan Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "10.00 - 11.30 WIB",
    hari: "Sabtu · Pekan 1",
    lokasi: "Masjid Arga Baja Grogol",
    alamat: "Masjid Arga Baja Grogol",
    status: "aktif",
    kategori: "Akhlak",
    deskripsi:
      "Kajian tentang 100 dosa yang sering diremehkan wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Sangat penting untuk diikuti setiap muslimah.",
  },
  {
    id: "r10b",
    judul: "100 Dosa yang Diremehkan Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "10.00 - 11.30 WIB",
    hari: "Sabtu · Pekan 3",
    lokasi: "Masjid Arga Baja Grogol",
    alamat: "Masjid Arga Baja Grogol",
    status: "aktif",
    kategori: "Akhlak",
    deskripsi:
      "Kajian tentang 100 dosa yang sering diremehkan wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Sangat penting untuk diikuti setiap muslimah.",
  },
  {
    id: "r11",
    judul: "Tafsir Juz 'Amma",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.30 - selesai",
    hari: "Sabtu · Pekan 2",
    lokasi: "Masjid al-Ikhlas",
    alamat: "Masjid al-Ikhlas",
    status: "aktif",
    kategori: "Tafsir",
    deskripsi:
      "Kajian tafsir surah-surah dalam Juz 'Amma bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r11b",
    judul: "100 Dosa yang Diremehkan Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "10.00 - 11.30 WIB",
    hari: "Sabtu · Pekan 4",
    lokasi: "Masjid Arga Baja Grogol",
    alamat: "Masjid Arga Baja Grogol",
    status: "aktif",
    kategori: "Akhlak",
    deskripsi:
      "Kajian tentang 100 dosa yang sering diremehkan wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Sangat penting untuk diikuti setiap muslimah.",
  },

  // ── AHAD ────────────────────────────────────────────────────────────────
  {
    id: "r12",
    judul: "Hilyah Thalibul 'Ilmi",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.00 - 09.30 WIB",
    hari: "Ahad · Pekan 1",
    lokasi: "RT Abu Bakar Topaz VPH",
    alamat: "RT Abu Bakar Topaz VPH",
    status: "aktif",
    kategori: "Ilmu",
    deskripsi:
      "Kajian Hilyah Thalibul 'Ilmi bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas adab dan akhlak seorang penuntut ilmu.",
  },
  {
    id: "r13",
    judul: "Tsalatsatul Ushul",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "09.30 - 11.00 WIB",
    hari: "Ahad · Pekan 1",
    lokasi: "Rumah Azaji Zamrud",
    alamat: "Rumah Azaji Zamrud",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian kitab Tsalatsatul Ushul (Tiga Landasan Pokok) karya Syaikh Muhammad bin Abdul Wahhab bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r14",
    judul: "Kajian Ahad Pekan 2",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.00 - 09.30 WIB",
    hari: "Ahad · Pekan 2",
    lokasi: "R. Bu Malika Topaz VPH",
    alamat: "R. Bu Malika Topaz VPH",
    status: "akan_datang",
    kategori: "Umum",
    deskripsi:
      "Kajian rutin bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله di R. Bu Malika Topaz VPH. Jadwal dan topik masih konfirmasi.",
  },
];

export const DUMMY_MUDZAKARAH: MudzakarahTopic[] = [
  {
    id: "m1",
    judul: "Hukum membaca Al-Quran saat haid",
    pertanyaan:
      "Bagaimana hukum membaca Al-Quran tanpa menyentuh mushaf saat kondisi haid? Mohon penjelasannya.",
    authorName: "Umi Fatimah",
    createdAt: "2026-05-10T08:00:00Z",
    jawaban: [
      {
        id: "j1",
        topicId: "m1",
        isi: "Jumhur ulama membolehkan membaca Al-Quran dari hafalan saat haid. Yang dilarang adalah menyentuh mushaf secara langsung. Wallahu a'lam.",
        authorName: "Khadijah",
        createdAt: "2026-05-10T09:00:00Z",
      },
      {
        id: "j2",
        topicId: "m1",
        isi: "Bisa baca via HP atau tablet tanpa menyentuh mushaf fisik. Sebagian ulama membolehkan asal tidak ada unsur memegangnya.",
        authorName: "Ummu Salmah",
        createdAt: "2026-05-10T10:00:00Z",
      },
    ],
  },
  {
    id: "m2",
    judul: "Amalan yang dianjurkan di bulan Dzulhijjah",
    pertanyaan:
      "Apa saja amalan sunnah yang sangat dianjurkan di 10 hari pertama Dzulhijjah? Bagi yang tidak berhaji.",
    authorName: "Zainab",
    createdAt: "2026-05-09T07:30:00Z",
    jawaban: [
      {
        id: "j3",
        topicId: "m2",
        isi: "Di antara amalan utama: puasa Tarwiyah (8 Dzulhijjah) dan Arafah (9 Dzulhijjah), perbanyak takbir, tahmid, tahlil, dan tasbih, serta memperbanyak sedekah.",
        authorName: "Aisyah",
        createdAt: "2026-05-09T08:00:00Z",
      },
    ],
  },
  {
    id: "m3",
    judul: "Tips menjaga konsistensi hadir kajian",
    pertanyaan:
      "Bagaimana cara sahabat semua menjaga semangat dan konsistensi hadir kajian? Kadang mudah futur nih.",
    authorName: "Nurul",
    createdAt: "2026-05-08T19:00:00Z",
    jawaban: [
      {
        id: "j4",
        topicId: "m3",
        isi: "Cari teman yang satu tujuan, buat grup khusus untuk saling mengingatkan. Niatkan karena Allah, bukan karena semangat semata.",
        authorName: "Maryam",
        createdAt: "2026-05-08T19:30:00Z",
      },
      {
        id: "j5",
        topicId: "m3",
        isi: "Buat jadwal khusus dan masukkan ke kalender. Jangan lupa catat faedah tiap kajian supaya ada 'kenangan' yang mengikat kita untuk kembali.",
        authorName: "Hafshah",
        createdAt: "2026-05-08T20:00:00Z",
      },
    ],
  },
];
