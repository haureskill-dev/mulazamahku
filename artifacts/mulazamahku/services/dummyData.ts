import { Kajian, MudzakarahTopic } from "@/types";

export const DUMMY_KAJIAN: Kajian[] = [
  {
    id: "1",
    judul: "Tafsir Al-Quran Juz 30",
    ustadz: "Ustadzah Aisyah Afra",
    waktu: "08:00 - 10:00 WIB",
    hari: "Ahad",
    lokasi: "Masjid Al-Ikhlas",
    alamat: "Jl. Cihampelas No. 12, Bandung",
    status: "aktif",
    kategori: "Tafsir",
    deskripsi:
      "Kajian tafsir Al-Quran Juz 30 secara rutin setiap Ahad pagi. Membahas tafsir dan tadabbur ayat-ayat pendek beserta pelajaran akhlak yang bisa diambil.",
    lat: -6.9042,
    lng: 107.6129,
  },
  {
    id: "2",
    judul: "Hadits Arbain Nawawi",
    ustadz: "Ustadz Abdullah Zaen",
    waktu: "10:00 - 11:30 WIB",
    hari: "Sabtu",
    lokasi: "Masjid Ar-Rahman",
    alamat: "Jl. Kemang Raya No. 7, Jakarta Selatan",
    status: "aktif",
    kategori: "Hadits",
    deskripsi:
      "Pembahasan mendalam 40 hadits pilihan Imam An-Nawawi. Cocok untuk muslimah yang ingin memahami pokok-pokok ajaran Islam secara komprehensif.",
    lat: -6.2088,
    lng: 106.8456,
  },
  {
    id: "3",
    judul: "Halaqah Fikih Wanita",
    ustadz: "Ustadzah Ummu Abdillah",
    waktu: "15:30 - 17:00 WIB",
    hari: "Rabu",
    lokasi: "Rumah Belajar Muslimah",
    alamat: "Jl. Menoreh Tengah No. 5, Semarang",
    status: "aktif",
    kategori: "Fikih",
    deskripsi:
      "Halaqah khusus untuk muslimah membahas fikih thaharah, shalat, puasa, dan fiqhun nisa. Suasana kondusif dan interaktif.",
    lat: -7.0051,
    lng: 110.4381,
  },
  {
    id: "4",
    judul: "Kajian Akidah Islamiyyah",
    ustadz: "Ustadz Firanda Andirja",
    waktu: "20:00 - 21:30 WIB",
    hari: "Jumat",
    lokasi: "Live YouTube",
    alamat: "Online via YouTube",
    status: "online",
    kategori: "Akidah",
    deskripsi:
      "Pembahasan Kitab Aqidah Wasithiyah karya Ibnu Taimiyyah. Disampaikan secara online agar bisa diikuti dari mana saja.",
  },
  {
    id: "5",
    judul: "Sirah Nabawiyyah",
    ustadz: "Ustadz Khalid Basalamah",
    waktu: "09:00 - 10:30 WIB",
    hari: "Kamis",
    lokasi: "Masjid Agung Al-Azhar",
    alamat: "Jl. Sisingamangaraja, Jakarta Selatan",
    status: "akan_datang",
    kategori: "Sirah",
    deskripsi:
      "Kajian perjalanan hidup Rasulullah SAW dari kelahiran hingga wafat. Dipenuhi dengan pelajaran berharga untuk kehidupan sehari-hari.",
    lat: -6.2297,
    lng: 106.7997,
  },
  {
    id: "6",
    judul: "Riyadhus Shalihin",
    ustadz: "Ustadzah Nadia Hasnaa",
    waktu: "07:00 - 08:30 WIB",
    hari: "Senin & Kamis",
    lokasi: "Pesantren Al-Hikmah",
    alamat: "Jl. Pesantren No. 1, Yogyakarta",
    status: "aktif",
    kategori: "Hadits",
    deskripsi:
      "Pembahasan kitab Riyadhus Shalihin karya Imam An-Nawawi. Mencakup hadits-hadits tentang akhlak, ibadah, dan muamalah.",
    lat: -7.7956,
    lng: 110.3695,
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
