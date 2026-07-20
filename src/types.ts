export interface BukuAmal {
  id: string;
  nama: string;
}

export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  bukuAmalId: string; // ID of BukuAmal
  bukuAmalNama?: string; // Resolved name of BukuAmal
  tipe: TransactionType;
  kategori: string;
  jumlah: number;
  keterangan: string;
}

export interface SchoolSettings {
  namaSekolah: string;
  alamatSekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  logoSekolah: string; // Base64 data URL
  kopSekolah: string; // Base64 data URL
  appsScriptUrl?: string; // Google Apps Script Web App URL for automatic passwordless sync
  kotaSekolah?: string; // Kota/Kabupaten
}

export interface GoogleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}
