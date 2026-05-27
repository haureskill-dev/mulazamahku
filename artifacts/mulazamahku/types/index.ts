export type UserRole = "murid" | "pengajar" | "admin";

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
  maps_url?: string;
  lat?: number;
  lng?: number;
}

export interface JadwalPerubahan {
  id: string;
  kajian_id: string;
  tanggal: string;
  perubahan: string;
  waktu_baru?: string;
  lokasi_baru?: string;
  dibuat_oleh?: string;
  created_at: string;
}

export interface Flyer {
  id: string;
  kajian_id: string;
  image_url: string;
  keterangan?: string;
  tanggal_berlaku?: string;
  dibuat_oleh?: string;
  created_at: string;
}

export interface CatatanPengajar {
  id: string;
  kajian_id: string;
  tanggal: string;
  materi_sampai: string;
  catatan?: string;
  dibuat_oleh?: string;
  created_at: string;
}

export interface RujukanKitab {
  id: string;
  kajian_id?: string;
  judul_kitab: string;
  penulis?: string;
  deskripsi?: string;
  file_url?: string;
  izin_penggunaan: boolean;
  catatan_izin?: string;
  dibuat_oleh?: string;
  created_at: string;
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
  role: UserRole;
  photoURL?: string;
  totalKajian: number;
  totalCatatan: number;
  bergabungSejak: string;
}
