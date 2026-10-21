# DIPLabs

Aplikasi mobile untuk mengelola sesi dan presensi praktikum. Asisten
dapat membuka dan menutup sesi praktikum serta melihat rekap kehadiran,
sementara praktikan dapat melihat jadwal, melakukan presensi ketika sesi
dibuka, dan memeriksa riwayat kehadirannya.

Sprint ini berfokus pada antarmuka pengguna (UI), navigasi, dan
interaksi. Data menggunakan dummy data dan state lokal selama aplikasi
berjalan; aplikasi belum menggunakan backend atau database.

## User Story

  -----------------------------------------------------------------------
  ID                      Aktor                   User Story
  ----------------------- ----------------------- -----------------------
  US-01                   Pengguna                Memilih peran dan
                                                  identitas dummy sebagai
                                                  asisten atau praktikan
                                                  sebelum menggunakan
                                                  aplikasi.

  US-02                   Asisten                 Melihat daftar dan
                                                  detail sesi praktikum
                                                  yang memuat nama
                                                  praktikum, kelas,
                                                  tanggal, jam, dan
                                                  status sesi.

  US-03                   Asisten                 Membuka sesi praktikum
                                                  agar praktikan dapat
                                                  melakukan presensi.

  US-04                   Praktikan               Melihat daftar dan
                                                  detail sesi praktikum
                                                  beserta status, jadwal,
                                                  lokasi, dan nama
                                                  asisten jika tersedia.

  US-05                   Praktikan               Melakukan presensi pada
                                                  sesi yang berstatus
                                                  terbuka dan menerima
                                                  konfirmasi beserta
                                                  waktu presensi.

  US-06                   Praktikan               Tidak dapat melakukan
                                                  presensi jika sesi
                                                  belum dibuka, sudah
                                                  ditutup, atau praktikan
                                                  sudah tercatat hadir.

  US-07                   Asisten                 Melihat rekap presensi
                                                  suatu sesi beserta nama
                                                  praktikan dan waktu
                                                  kehadiran.

  US-08                   Asisten                 Menutup sesi praktikum
                                                  sehingga presensi untuk
                                                  sesi tersebut tidak
                                                  dapat dilakukan lagi.

  US-09                   Praktikan               Melihat riwayat
                                                  presensi miliknya
                                                  sendiri, termasuk waktu
                                                  kehadiran.
  -----------------------------------------------------------------------

User story digunakan sebagai acuan kebutuhan fitur dan pembagian tugas
pengembangan. Implementasi setiap fitur mengacu pada kontrak integrasi
dan kriteria selesai yang ditetapkan di `AGENTS.md`.

## Requirement

-   Node.js dan npm
-   Expo CLI melalui `npx expo`
-   React Native
-   TypeScript
-   Expo Router
-   Android Emulator atau perangkat Android dengan Expo Go, atau
    lingkungan lain yang didukung Expo
-   Tidak memerlukan backend atau database untuk Sprint 1

## Setup Lokal (Untuk Anggota Tim)

1.  **Clone repository dan masuk ke direktori proyek**

    ``` bash
    git clone <URL_REPOSITORY>
    cd DIPLabs
    ```

    Jika repository sudah tersedia secara lokal, buka terminal pada
    direktori proyek. Gunakan branch yang sedang dikerjakan sesuai
    pembagian tugas tim.

2.  **Install dependencies**

    ``` bash
    npm install
    ```

3.  **Jalankan aplikasi**

    ``` bash
    npx expo start
    ```

    Ikuti instruksi Expo untuk menjalankan aplikasi pada emulator atau
    perangkat. Jika menggunakan Android Emulator, pastikan Android SDK
    dan emulator sudah dikonfigurasi.

4.  **Menjalankan pemeriksaan TypeScript**

    ``` bash
    npx tsc --noEmit
    ```

    Jalankan lint jika skrip lint tersedia di `package.json`. Laporkan
    hasil pemeriksaan yang benar-benar dijalankan; jangan menyatakan tes
    berhasil jika belum dijalankan.

## Data dan Penyimpanan

Sprint ini menggunakan data fiktif yang disimpan dalam dummy data dan
state lokal aplikasi.

-   Perubahan status sesi dan presensi dapat terlihat lintas peran
    selama aplikasi berjalan dalam satu runtime.
-   Data dapat hilang ketika aplikasi dimuat ulang.
-   Tidak ada sinkronisasi antarperangkat.
-   Tidak ada backend, API jaringan, atau database.
-   Data identitas, sesi, dan presensi tidak boleh menggunakan data
    pribadi nyata.

## Role & Alur Singkat

  -----------------------------------------------------------------------
  Role                                Yang bisa dilakukan
  ----------------------------------- -----------------------------------
  Pengunjung aplikasi                 Memilih peran dan identitas dummy
                                      dari halaman awal.

  Praktikan                           Melihat jadwal dan detail sesi,
                                      melakukan presensi saat sesi
                                      terbuka, serta melihat riwayat
                                      presensi pribadi.

  Asisten                             Melihat jadwal dan detail sesi,
                                      membuka sesi, memeriksa rekap
                                      presensi, dan menutup sesi.
  -----------------------------------------------------------------------

### Alur demo wajib

1.  Pilih identitas asisten pada halaman awal.
2.  Pilih sesi praktikum dan buka sesi.
3.  Kembali ke halaman pemilihan identitas, lalu pilih identitas
    praktikan.
4.  Buka sesi yang sama dan lakukan presensi.
5.  Pastikan konfirmasi dan waktu presensi ditampilkan.
6.  Coba melakukan presensi sekali lagi dan pastikan sistem mencegah
    presensi ganda.
7.  Kembali ke identitas asisten dan buka rekap sesi.
8.  Pastikan nama praktikan dan waktu presensi terlihat.
9.  Tutup sesi dan pastikan status berubah menjadi `closed`.
10. Pastikan praktikan tidak dapat melakukan presensi setelah sesi
    ditutup.

## Status Sesi

  -----------------------------------------------------------------------
  Status                  Arti                    Perilaku presensi
  ----------------------- ----------------------- -----------------------
  `upcoming`              Sesi belum dibuka       Presensi dinonaktifkan.

  `open`                  Sesi sedang dibuka      Praktikan yang belum
                                                  hadir dapat melakukan
                                                  presensi.

  `closed`                Sesi telah ditutup      Presensi dinonaktifkan.
  -----------------------------------------------------------------------

## Kontrak Data Bersama

Model data utama berada di `src/types/attendance.ts`:

-   `UserRole`: `'asisten' | 'praktikan'`
-   `SessionStatus`: `'upcoming' | 'open' | 'closed'`
-   `AppUser`: identitas dan peran pengguna.
-   `PracticumSession`: informasi jadwal dan status sesi.
-   `AttendanceRecord`: catatan presensi beserta timestamp.

State bersama dikelola melalui `AttendanceProvider` dan hook
`useAttendance()` dari `src/context/AttendanceContext.tsx`. API context
minimal menyediakan identitas aktif, daftar asisten/praktikan, sesi,
catatan presensi, fungsi membuka/menutup sesi, pencatatan presensi,
serta pengambilan rekap sesi dan riwayat praktikan.

Fungsi `recordAttendance` harus memvalidasi status sesi, keberadaan
identitas praktikan, dan duplikasi presensi. Waktu presensi menggunakan
timestamp aktual ketika tindakan dilakukan.

## Struktur Proyek

Struktur target sesuai `AGENTS.md`:

``` text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── asisten/
│   │   ├── index.tsx
│   │   ├── [sessionId].tsx
│   │   └── rekap/
│   │       └── [sessionId].tsx   # opsional; rekap dapat menggunakan Modal
│   └── praktikan/
│       ├── index.tsx
│       ├── [sessionId].tsx
│       └── riwayat.tsx
├── components/
│   ├── asisten/
│   ├── praktikan/
│   └── shared/
├── context/
│   └── AttendanceContext.tsx
├── data/
│   └── mockData.ts
└── types/
    └── attendance.ts
```

Nama atau struktur file dapat mengikuti implementasi aktual selama rute
dan kontrak integrasi yang disepakati tetap dipertahankan.
