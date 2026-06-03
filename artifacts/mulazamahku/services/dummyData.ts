import { Kajian, MudzakarahTopic, OjekMuslimahContact, PengajarProfile, AdminKajianContact } from "@/types";

// Semua pekan dijabarkan terpisah — tidak ada penggabungan "Pekan X & Y"
export const DUMMY_KAJIAN: Kajian[] = [
  // ── SELASA ──────────────────────────────────────────────────────────────
  // (Jadwal Selasa di-off-kan sementara untuk testing)

  // ── RABU ────────────────────────────────────────────────────────────────
  {
    id: "r3",
    judul: "Fiqih Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "15.45 - 17.30 WIB",
    hari: "Rabu · Pekan 1 & 3",
    lokasi: "Metro Mediterania",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian fikih khusus untuk wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum fikih yang berkaitan dengan wanita muslimah.",
    mapsUrl: "https://maps.google.com/?q=Metro+Mediterania",
  },
  {
    id: "r4",
    judul: "Fadhlul Islam",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Rabu · Pekan 2",
    lokasi: "Masjid Imam an-Nawawi",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian kitab Fadhlul Islam bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas keutamaan dan keistimewaan agama Islam.",
    mapsUrl: "https://maps.google.com/?q=Masjid+Imam+an-Nawawi",
  },

  // ── KAMIS ───────────────────────────────────────────────────────────────
  {
    id: "r5",
    judul: "Fiqih Asmaul Husna",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.15 WIB",
    hari: "Kamis · Pekan 1 & 3",
    lokasi: "Masjid Abu Bakar ash-Shiddiq",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian Fiqih Asmaul Husna bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas nama-nama Allah yang indah dan implikasinya dalam kehidupan.",
    mapsUrl: "https://maps.google.com/?q=Masjid+Abu+Bakar+ash-Shiddiq",
  },
  {
    id: "r6",
    judul: "Kitabut Tauhid",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.15 WIB",
    hari: "Kamis · Pekan 2 & 4",
    lokasi: "Masjid Abu Bakar ash-Shiddiq",
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian Kitabut Tauhid karya Syaikh Muhammad bin Abdul Wahhab bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
    mapsUrl: "https://maps.google.com/?q=Masjid+Abu+Bakar+ash-Shiddiq",
  },

  // ── JUMAT ───────────────────────────────────────────────────────────────
  {
    id: "r7",
    judul: "Fiqih Haid",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Jumat · Pekan 2 & 4",
    lokasi: "Zircon Villa Permata Hijau",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Kajian Fiqih Haid bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum seputar haid yang wajib diketahui setiap muslimah.",
  },
  {
    id: "r8",
    judul: "Kajian Jumat",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "(masih konfirmasi)",
    hari: "Jumat · Pekan 4",
    lokasi: "Masjid as-Salam GSI",
    status: "akan_datang",
    kategori: "Umum",
    deskripsi:
      "Kajian rutin bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله di Masjid as-Salam GSI. Jadwal dan topik masih konfirmasi.",
  },

  // ── SABTU ───────────────────────────────────────────────────────────────
  {
    id: "r9",
    judul: "Hilyah Thalibul 'Ilmi & al-Firqotun Naiyah",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "09.30 - selesai",
    hari: "Sabtu · Pekan 1 & 3",
    lokasi: "Masjid Imam asy-Syafi'i",
    status: "aktif",
    kategori: "Ilmu",
    deskripsi:
      "Kajian Hilyah Thalibul 'Ilmi dan kitab al-Firqotun Naiyah bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r11",
    judul: "Tafsir Juz 'Amma",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.30 - selesai",
    hari: "Sabtu · Pekan 2",
    lokasi: "Masjid al-Ikhlas",
    status: "aktif",
    kategori: "Tafsir",
    deskripsi:
      "Kajian tafsir surah-surah dalam Juz 'Amma bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r10",
    judul: "100 Dosa yang Diremehkan Wanita",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "10.00 - 11.30 WIB",
    hari: "Sabtu · Pekan 4",
    lokasi: "Masjid Arga Baja Grogol",
    status: "aktif",
    kategori: "Akhlak",
    deskripsi:
      "Kajian tentang 100 dosa yang sering diremehkan wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Sangat penting untuk diikuti setiap muslimah.",
  },
  {
    id: "r8_b",
    judul: "Kajian Sabtu Sore",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "16.00 - 17.30 WIB",
    hari: "Sabtu · Pekan 4",
    lokasi: "GSI Blok H",
    status: "aktif",
    kategori: "Umum",
    deskripsi:
      "Kajian rutin Sabtu sore bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
    mapsUrl: "https://maps.google.com/?q=GSI+Blok+H",
  },

  // ── AHAD ────────────────────────────────────────────────────────────────
  {
    id: "r12",
    judul: "Hilyah Thalibul 'Ilmi",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.00 - 09.30 WIB",
    hari: "Ahad · Pekan 1",
    lokasi: "RT Abu Bakar Topaz VPH",
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
    status: "aktif",
    kategori: "Akidah",
    deskripsi:
      "Kajian kitab Tsalatsatul Ushul (Tiga Landasan Pokok) karya Syaikh Muhammad bin Abdul Wahhab bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.",
  },
  {
    id: "r14",
    judul: "Kajian Ahad",
    ustadz: "Ustadzah Rubeya Litiloly, S.Kom.",
    waktu: "08.00 - 09.30 WIB",
    hari: "Ahad · Pekan 2",
    lokasi: "R. Bu Malika Topaz VPH",
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

// ── Kontak Ojek Muslimah (urut abjad) ─────────────────────────────────
export const OJEK_CONTACTS: OjekMuslimahContact[] = [
  { id: "1", nama: "Bu Ojek Muslimah", phone: "6282179375736" },
  { id: "2", nama: "Ummu Tama", phone: "6281953993941" },
  { id: "3", nama: "Ummu Tsabit", phone: "6288293108711" },
];

// ── Profil Pengajar ───────────────────────────────────────────────────
export const PENGAJAR_PROFILES: PengajarProfile[] = [
  {
    id: "p1",
    nama: "Rubeya Litiloly",
    gelar: "S.Kom.",
    tempatLahir: "Fak-fak, Papua",
    agama: "Islam",
    status: "Menikah",
    pendidikanTerakhir: "S1 – Teknik Informatika",
    alamat: "Cilegon, Banten",
    pendidikanNonFormal: [
      "PP. Al Furqon Al Islamy Gresik",
      "Belajar Ilmu Hadits pada Syaikh Muhammad Alu Syaikh",
      "Belajar Ilmu Fiqih kepada Syaikh Abul Hasan Yahya Al Ja'fary",
      "Belajar Kitab-kitab Silsilah Tholibil Ilmi pada Syaikh Sholih Bin Abdullah Bin Hamad Al 'Ushoimiy",
    ],
    aktivitasSaatIni: [
      "Praktisi Pendidikan (Kepala SMAIT Putri Al Hanif)",
      "Da'iyyah",
      "Ketua Ikatan Alumni Akhwat – Ma'had Al Furqon Al Islamy, Gresik",
      "Ketua Tim Janaiz Akhwat – DKM Imam An Nawawi, Yayasan Al Hanif",
      "Pengurus Divisi Kemuslimahan Lajnah Dakwah Yayasan Al Hanif",
    ],
    aktivitasBelajar: [
      "Mahasantri HSI Akademi dan Santri HSI Reguler",
      "Kelas Hifdzul Qur'an secara Online di Masjid Nabawi, Madinah Al Munawwaroh pada Syaikhoh Ummu Hani'",
      "Kelas Hifdzul Mutun Ilmiyyah secara Online pada Syaikhoh Hauro dan Syaikhoh Manar",
    ],
  },
];

// ── Admin CP Kajian ───────────────────────────────────────────────────
export const ADMIN_KAJIAN_CONTACTS: AdminKajianContact[] = [
  { id: "cp1", nama: "Ibu Gina", phone: "6281380810334", lokasi: "Metro Mediterania" },
  { id: "cp2", nama: "Eka Ummu Utsman", phone: "6281932011785", lokasi: "Masjid Imam an-Nawawi" },
  { id: "cp3", nama: "Ummu Azka", phone: "6287755247467", lokasi: "Masjid Abu Bakar ash-Shiddiq" },
  { id: "cp4", nama: "Ummu Niar", phone: "6287774004560", lokasi: "Zircon Villa Permata Hijau" },
  { id: "cp5", nama: "Ukh Hilda", phone: "6289517288810", lokasi: "Masjid as-Salam GSI" },
  { id: "cp6", nama: "Ukh Dinda", phone: "628121366889", lokasi: "Masjid Imam asy-Syafi'i" },
  { id: "cp7", nama: "CP Masjid Al Ikhlash", phone: "6281276964336", lokasi: "Masjid al-Ikhlas" },
  { id: "cp8", nama: "CP Masjid Arga", phone: "6281288691998", lokasi: "Masjid Arga Baja Grogol" },
  { id: "cp9", nama: "Ummu Iffvy", phone: "6285291171799", lokasi: "RT Abu Bakar Topaz VPH" },
  { id: "cp10", nama: "CP Kajian Rumah Azaji Zamrud", phone: "6281805021014", lokasi: "Rumah Azaji Zamrud" },
  { id: "cp11", nama: "Ukh Lenny", phone: "62817895557", lokasi: "R. Bu Malika Topaz VPH" },
];
