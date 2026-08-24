# Islam Tracker Web App

![Preview](https://img.lightshot.app/Hs1z5sHySW6NtqSkJOpMPA.png)

Aplikasi web pelacak ibadah harian Muslim yang dibangun menggunakan React, TypeScript, dan Vite. Aplikasi menyimpan data lokal di browser menggunakan IndexedDB.

## Fitur Utama

- **Jadwal Sholat & Notifikasi**: Menampilkan waktu sholat harian berdasarkan lokasi serta pencatatan pelaksanaan sholat.
- **Pelacak Puasa**: Catat puasa wajib (Ramadhan) dan sunnah (Senin-Kamis, Ayyamul Bidh, dll).
- **Al-Qur'an Online**: Baca surat, ayat, terjemahan, dan tandai progres tilawah harian.
- **Kumpulan Doa & Dzikir**: Doa harian lengkap dengan teks Arab, latin, dan terjemahan.
- **Koleksi Hadits**: Akses hadits-hadits pilihan.
- **Tasbih Digital**: Penghitung dzikir interaktif.
- **Arah Kiblat**: Kompas penunjuk arah Ka'bah.
- **Laporan & Statistik**: Rekap aktivitas ibadah harian, mingguan, dan bulanan.

## Teknologi

- **Framework**: React 19
- **Build Tool**: Vite
- **Bahasa**: TypeScript
- **Routing**: React Router
- **Penyimpanan Lokal**: IndexedDB (via `idb`)

## Memulai Proyek

### Prasyarat

- Node.js (versi 18 ke atas disarankan)
- npm atau yarn / pnpm

### Instalasi

1. Clone repositori:
   ```bash
   git clone git@github.com:Adytm404/islam-tracker-web-app.git
   cd islam-tracker-web-app
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan server lokal:
   ```bash
   npm run dev
   ```

4. Build untuk produksi:
   ```bash
   npm run build
   ```

## Lisensi

Proyek ini dibuat untuk keperluan ibadah pribadi dan pengembangan bersama.
