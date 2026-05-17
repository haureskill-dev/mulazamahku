export interface Kajian {
  id: string;
  judul: string;
  ustadz: string;
  waktu: string;
  hari: string;
  lokasi: string;
  status: "aktif" | "akan_datang" | "selesai" | "online";
  kategori: string;
  deskripsi: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
}

export interface Note {
  id: string;
  judul: string;
  isi: string;
  kajianId?: string;
  kajianJudul?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface MudzakarahTopic {
  id: string;
  judul: string;
  pertanyaan: string;
  authorName: string;
  createdAt: string;
  jawaban: MudzakarahJawaban[];
}

export interface MudzakarahJawaban {
  id: string;
  topicId: string;
  isi: string;
  authorName: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  photoURL?: string;
  totalKajian: number;
  totalCatatan: number;
  bergabungSejak: string;
}
