# DIPLabs


Aplikasi mobile untuk mengelola sesi dan presensi praktikum. Asisten dapat membuka dan menutup sesi praktikum serta melihat rekap kehadiran, sementara praktikan dapat melihat jadwal, melakukan presensi ketika sesi dibuka, dan memeriksa riwayat kehadirannya.

# PERTEMUAN 1

Aplikasi mobile untuk mengelola sesi dan presensi praktikum. Asisten
dapat membuka dan menutup sesi praktikum serta melihat rekap kehadiran,
sementara praktikan dapat melihat jadwal, melakukan presensi ketika sesi
dibuka, dan memeriksa riwayat kehadirannya.

Sprint ini berfokus pada antarmuka pengguna (UI), navigasi, dan interaksi. Data menggunakan dummy data dan state lokal selama aplikasi berjalan; aplikasi belum menggunakan backend atau database.

## User Story

| ID | Aktor | User Story |
| :--- | :--- | :--- |
| **US-01** | Pengguna | Memilih peran dan identitas dummy sebagai asisten atau praktikan sebelum menggunakan aplikasi. |
| **US-02** | Asisten | Melihat daftar dan detail sesi praktikum yang memuat nama praktikum, kelas, tanggal, jam, dan status sesi. |
| **US-03** | Asisten | Membuka sesi praktikum agar praktikan dapat melakukan presensi. |
| **US-04** | Praktikan | Melihat daftar dan detail sesi praktikum beserta status, jadwal, lokasi, dan nama asisten jika tersedia. |
| **US-05** | Praktikan | Melakukan presensi pada sesi yang berstatus terbuka dan menerima konfirmasi beserta waktu presensi. |
| **US-06** | Praktikan | Tidak dapat melakukan presensi jika sesi belum dibuka, sudah ditutup, atau praktikan sudah tercatat hadir. |
| **US-07** | Asisten | Melihat rekap presensi suatu sesi beserta nama praktikan dan waktu kehadiran. |
| **US-08** | Asisten | Menutup sesi praktikum sehingga presensi untuk sesi tersebut tidak dapat dilakukan lagi. |
| **US-09** | Praktikan | Melihat riwayat presensi miliknya sendiri, termasuk waktu kehadiran. |

User story digunakan sebagai acuan kebutuhan fitur dan pembagian tugas pengembangan. Implementasi setiap fitur mengacu pada kontrak integrasi dan kriteria selesai yang ditetapkan di `AGENTS.md`.

## Requirement

- Node.js dan npm
- Expo CLI melalui `npx expo`
- React Native
- TypeScript
- Expo Router
- Android Emulator atau perangkat Android dengan Expo Go, atau lingkungan lain yang didukung Expo
- Tidak memerlukan backend atau database untuk Sprint 1

## Setup Lokal (Untuk Anggota Tim)

1. **Clone repository dan masuk ke direktori proyek**

   ```bash
   git clone https://github.com/dhymarbun/DIPLabs
   cd DIPLabs

```

Jika repository sudah tersedia secara lokal, buka terminal pada direktori proyek. Gunakan branch yang sedang dikerjakan sesuai pembagian tugas tim.

2. **Install dependencies**
```bash
npm install

```


3. **Jalankan aplikasi**
```bash
npx expo start

```


Ikuti instruksi Expo untuk menjalankan aplikasi pada emulator atau perangkat. Jika menggunakan Android Emulator, pastikan Android SDK dan emulator sudah dikonfigurasi.
4. **Menjalankan pemeriksaan TypeScript**
```bash
npx tsc --noEmit

```


Jalankan lint jika skrip lint tersedia di `package.json`. Laporkan hasil pemeriksaan yang benar-benar dijalankan; jangan menyatakan tes berhasil jika belum dijalankan.

## Data dan Penyimpanan

Sprint ini menggunakan data fiktif yang disimpan dalam dummy data dan state lokal aplikasi.

* Perubahan status sesi dan presensi dapat terlihat lintas peran selama aplikasi berjalan dalam satu runtime.
* Data dapat hilang ketika aplikasi dimuat ulang.
* Tidak ada sinkronisasi antarperangkat.
* Tidak ada backend, API jaringan, atau database.
* Data identitas, sesi, dan presensi tidak boleh menggunakan data pribadi nyata.

## Role & Alur Singkat

| Role | Yang bisa dilakukan |
| --- | --- |
| **Pengunjung aplikasi** | Memilih peran dan identitas dummy dari halaman awal. |
| **Praktikan** | Melihat jadwal dan detail sesi, melakukan presensi saat sesi terbuka, serta melihat riwayat presensi pribadi. |
| **Asisten** | Melihat jadwal dan detail sesi, membuka sesi, memeriksa rekap presensi, dan menutup sesi. |

### Alur Demo Wajib

1. Pilih identitas asisten pada halaman awal.
2. Pilih sesi praktikum dan buka sesi.
3. Kembali ke halaman pemilihan identitas, lalu pilih identitas praktikan.
4. Buka sesi yang sama dan lakukan presensi.
5. Pastikan konfirmasi dan waktu presensi ditampilkan.
6. Coba melakukan presensi sekali lagi dan pastikan sistem mencegah presensi ganda.
7. Kembali ke identitas asisten dan buka rekap sesi.
8. Pastikan nama praktikan dan waktu presensi terlihat.
9. Tutup sesi dan pastikan status berubah menjadi `closed`.
10. Pastikan praktikan tidak dapat melakukan presensi setelah sesi ditutup.

## Status Sesi

| Status | Arti | Perilaku Presensi |
| --- | --- | --- |
| `upcoming` | Sesi belum dibuka | Presensi dinonaktifkan. |
| `open` | Sesi sedang dibuka | Praktikan yang belum hadir dapat melakukan presensi. |
| `closed` | Sesi telah ditutup | Presensi dinonaktifkan. |

## Kontrak Data Bersama

Model data utama berada di `src/types/attendance.ts`:

* `UserRole`: `'asisten' | 'praktikan'`
* `SessionStatus`: `'upcoming' | 'open' | 'closed'`
* `AppUser`: identitas dan peran pengguna.
* `PracticumSession`: informasi jadwal dan status sesi.
* `AttendanceRecord`: catatan presensi beserta timestamp.

State bersama dikelola melalui `AttendanceProvider` dan hook `useAttendance()` dari `src/context/AttendanceContext.tsx`. API context minimal menyediakan identitas aktif, daftar asisten/praktikan, sesi, catatan presensi, fungsi membuka/menutup sesi, pencatatan presensi, serta pengambilan rekap sesi dan riwayat praktikan.

Fungsi `recordAttendance` harus memvalidasi status sesi, keberadaan identitas praktikan, dan duplikasi presensi. Waktu presensi menggunakan timestamp aktual ketika tindakan dilakukan.

## Struktur Proyek

Struktur target sesuai `AGENTS.md`:

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── asisten/
│   │   ├── index.tsx
│   │   ├── [sessionId].tsx
│   │   └── rekap/
│   │       └── [sessionId].tsx    # opsional; rekap dapat menggunakan Modal
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

Nama atau struktur file dapat mengikuti implementasi aktual selama rute dan kontrak integrasi yang disepakati tetap dipertahankan.

```

```
Nama atau struktur file dapat mengikuti implementasi aktual selama rute
dan kontrak integrasi yang disepakati tetap dipertahankan.

# PERTEMUAN 2

Sprint 2 — Data Dinamis dengan Firebase

Pada sprint sebelumnya, aplikasi telah memiliki antarmuka dan alur
pengelolaan kegiatan praktikum menggunakan data lokal/dummy. Namun, data
yang digunakan belum tersimpan secara permanen dan belum terhubung antar
pengguna. Akibatnya, perubahan yang dilakukan oleh praktikan belum tentu
terlihat oleh asisten, begitu pula sebaliknya.

Kini aplikasi perlu dikembangkan agar dapat digunakan oleh banyak
pengguna dengan akun masing-masing. Praktikan dan asisten harus dapat
mengakses data yang sama secara real-time, dengan informasi dan tindakan
yang disesuaikan berdasarkan peran pengguna. Selain itu, praktikan yang
berhalangan mengikuti kegiatan praktikum membutuhkan fasilitas pengajuan
izin yang dapat diperiksa oleh asisten dengan bantuan Artificial
Intelligence (AI).

Pada sprint ini, kembangkan aplikasi React Native dari sprint
sebelumnya dengan mengintegrasikan Firebase Authentication untuk
pengelolaan akun, Cloud Firestore untuk penyimpanan dan sinkronisasi
data, serta model AI yang disediakan pengajar melalui API.

## User Story

| ID | Aktor | User Story |
| :--- | :--- | :--- |
| **US-10** | Pengguna | Melakukan registrasi, login, dan logout menggunakan Firebase Authentication. |
| **US-11** | Asisten | Mengelola data praktikum (tambah, lihat, ubah, hapus) terhadap data kelas, peserta, jadwal, dan sesi di Firestore. |
| **US-12** | Praktikan | Melihat jadwal dan informasi sesi yang relevan secara real-time dari Firestore. |
| **US-13** | Praktikan | Melakukan presensi yang tersinkronisasi secara real-time dengan Firestore dan mencegah presensi ganda. |
| **US-14** | Praktikan | Mengajukan izin untuk sesi tertentu dengan mengisi alasan ketidakhadiran. |
| **US-15** | Sistem | Mengirimkan alasan izin ke API model AI untuk mendapatkan prediksi kategori alasan. |
| **US-16** | Asisten | Melihat daftar pengajuan izin beserta alasan dan hasil klasifikasi AI. |
| **US-17** | Asisten | Menerima atau menolak pengajuan izin dan menyimpan keputusan di Firestore. |
| **US-18** | Praktikan | Memantau status pengajuan izin (proses, diterima, atau ditolak) secara real-time. |
| **US-19** | Pengguna | Akses dan perubahan data dibatasi sesuai identitas serta peran melalui Firebase Security Rules. |

## Requirement

- Node.js dan npm
- Expo CLI melalui `npx expo`
- React Native
- TypeScript
- Expo Router
- Firebase Project (Firebase Authentication & Cloud Firestore)
- API Model AI (disediakan pengajar)
- Koneksi internet untuk sinkronisasi data real-time

## Data dan Penyimpanan

Sprint ini menggunakan data dinamis yang disimpan secara terpusat dan
tersinkronisasi secara real-time.

* **Firebase Authentication**: Menyimpan kredensial dan menjadi
  sumber identitas pengguna.
* **Cloud Firestore**: Menyimpan data kelas, jadwal, sesi, catatan
  presensi, serta pengajuan izin secara terstruktur.
* **Real-time Synchronization**: Memanfaatkan Firestore real-time
  listeners agar perubahan data langsung terlihat lintas perangkat
  tanpa perlu memuat ulang aplikasi.
* **Data Persistence**: Seluruh perubahan tersimpan permanen dan
  tetap ada saat aplikasi ditutup lalu dibuka kembali.

## Role & Alur Singkat

| Role | Yang bisa dilakukan |
| --- | --- |
| **Pengguna (Auth)** | Melakukan registrasi akun baru, login, dan logout menggunakan Firebase Auth. |
| **Praktikan** | Melihat jadwal real-time, melakukan presensi saat sesi terbuka, mengajukan izin beserta alasan, dan memantau status izin. |
| **Asisten** | Mengelola data praktikum (CRUD), membuka/menutup sesi, memeriksa rekap presensi real-time, serta memeriksa dan memutuskan permohonan izin dengan bantuan klasifikasi AI. |

### Alur Demo Wajib

**Alur 1: Presensi Real-Time**
1. Asisten login ke dalam aplikasi.
2. Asisten memilih sesi praktikum dan membuka sesi.
3. Praktikan login di perangkat/sesi lain dan memilih sesi yang sama.
4. Praktikan melakukan presensi.
5. Catatan kehadiran tersimpan ke Firestore secara real-time.
6. Asisten melihat rekap kehadiran ter-update secara otomatis tanpa reload.
7. Asisten menutup sesi praktikum.

**Alur 2: Pengajuan Izin dengan Klasifikasi AI**
1. Praktikan login dan memilih sesi yang tidak dapat dihadiri.
2. Praktikan mengajukan izin dengan mengisi alasan ketidakhadiran.
3. Aplikasi memanggil API Model AI untuk mendapatkan prediksi kategori alasan.
4. Data izin beserta prediksi AI tersimpan di Firestore dengan status awal pending/proses.
5. Asisten membuka daftar pengajuan izin, melihat alasan dan label klasifikasi AI.
6. Asisten mengambil keputusan untuk menerima atau menolak izin.
7. Praktikan melihat status pengajuan izinnya ter-update secara real-time.

## Validasi dan Keamanan

- **Penanganan Error**: Menangani input tidak valid, kegagalan login/registrasi, gangguan jaringan Firestore, serta kondisi saat API AI tidak merespons (fallback).
- **Firebase Security Rules**: Membatasi hak baca dan tulis dokumen di Firestore berdasarkan autentikasi dan peran (role) pengguna.
- **Independensi Keputusan**: Prediksi model AI hanya menjadi acuan/informasi pendukung, keputusan akhir persetujuan izin sepenuhnya berada di tangan asisten.

# PERTEMUAN 3

Sprint 3 — Validasi Lokasi, Peta Laboratorium Interaktif, dan Push Notification

Pada sprint sebelumnya, aplikasi telah memiliki sistem autentikasi dan penyimpanan data menggunakan Firebase sehingga praktikan dan asisten dapat mengakses informasi yang sama secara real-time. Pengelolaan sesi, pencatatan presensi, serta pengajuan dan pemeriksaan izin juga telah terintegrasi dengan database.

Namun, presensi yang dilakukan praktikan belum mempertimbangkan lokasi fisik pengguna. Praktikan masih dapat melakukan presensi dari mana saja selama sesi dibuka. Selain itu, pengguna harus membuka aplikasi untuk mengetahui perubahan jadwal, pembukaan sesi, atau keputusan pengajuan izin.

Pada sprint ini, aplikasi dikembangkan dengan memanfaatkan layanan lokasi perangkat (Geolocation), peta interaktif (Google Maps), dan pemberitahuan perangkat (Push Notification). Aplikasi memeriksa keberadaan fisik praktikan dalam radius laboratorium ketika melakukan presensi, menampilkan persebaran lokasi laboratorium Informatika beserta aktivitas praktikumnya di atas peta, serta mengirimkan push notification ketika terdapat informasi penting.

## User Story

| ID | Aktor | User Story |
| :--- | :--- | :--- |
| **US-20** | Praktikan | Membuka halaman khusus presensi yang terpisah dari halaman detail sesi untuk melihat informasi sesi, status sesi, hasil pemeriksaan lokasi, dan melakukan presensi (opsional: menggunakan QR Code). |
| **US-21** | Praktikan | Melakukan presensi dengan validasi lokasi perangkat yang memastikan praktikan berada dalam radius laboratorium yang ditentukan saat sesi dibuka, serta mencegah presensi di luar radius atau presensi ganda. |
| **US-22** | Asisten | Mengelola data lokasi laboratorium (nama, ruangan, titik koordinat latitude/longitude, dan radius presensi) di Cloud Firestore serta menghubungkannya dengan sesi praktikum. |
| **US-23** | Pengguna | Membuka halaman Peta Laboratorium Interaktif (Maps) yang menampilkan marker lokasi laboratorium Informatika serta marker lokasi perangkat pengguna yang diperbarui secara real-time. |
| **US-24** | Pengguna | Memilih marker laboratorium pada peta untuk melihat detail laboratorium beserta informasi praktikum yang sedang berlangsung dan praktikum berikutnya secara real-time dari Firestore. |
| **US-25** | Sistem / Asisten | Mengirimkan push notification kepada pengguna terkait ketika sesi praktikum dibuka, jadwal praktikum mengalami perubahan, atau pengajuan izin diterima/ditolak oleh asisten. |
| **US-26** | Praktikan | Menerima push notification pada perangkat terkait pembukaan sesi, perubahan jadwal, atau keputusan pengajuan izin, serta dapat menavigasi ke halaman terkait saat notifikasi ditekan. |
| **US-27** | Pengguna | Memperoleh permintaan izin akses lokasi dan notifikasi perangkat serta informasi status yang jelas ketika izin ditolak, layanan lokasi tidak aktif, lokasi belum tersedia, koneksi terganggu, atau notifikasi tidak dapat diterima. |

## Requirement

- Node.js dan npm
- Expo CLI / React Native Development Build (mendukung modul native Maps, Geolocation, dan Push Notification)
- React Native & TypeScript
- Expo Router
- Firebase Project (Authentication, Cloud Firestore, dan Firebase Cloud Messaging / FCM)
- Layanan Peta & Lokasi: `react-native-maps`, `@react-native-community/geolocation`, `react-native-permissions` (atau modul geolocation setara)
- Layanan Push Notification: `@react-native-firebase/messaging` + `react-native-notify-kit` (atau mekanisme push notification React Native yang sesuai)
- Perangkat fisik atau emulator dengan Google Play Services, GPS/Location Service aktif, dan koneksi internet

## Data dan Penyimpanan

Sprint ini melanjutkan penggunaan data dinamis secara penuh di Cloud Firestore tanpa menggunakan dummy data:

* **Cloud Firestore (`laboratories`)**: Menyimpan daftar laboratorium Informatika beserta titik koordinat (`latitude`, `longitude`) dan radius validasi presensi (`radiusMeters`).
* **Cloud Firestore (`sessions` & `attendance`)**: Menyimpan referensi laboratorium/koordinat pada sesi praktikum serta mencatat titik koordinat dan jarak perangkat praktikan pada dokumen kehadiran saat presensi berhasil.
* **Cloud Firestore (`users` / `notifications`)**: Menyimpan token perangkat (FCM token) dan peristiwa notifikasi untuk pengiriman pemberitahuan terarah kepada pengguna yang berkepentingan.
* **Real-time Geolocation**: Memanfaatkan sensor GPS perangkat secara langsung untuk memantau posisi pengguna pada peta dan memvalidasi jarak ke laboratorium saat presensi.

## Role & Alur Singkat

| Role | Yang bisa dilakukan |
| --- | --- |
| **Praktikan** | Membuka halaman khusus presensi, memverifikasi posisi di dalam radius laboratorium untuk melakukan presensi, melihat peta interaktif laboratorium beserta kegiatan praktikum aktif/berikutnya, serta menerima push notification saat sesi dibuka, jadwal berubah, atau izin diputuskan. |
| **Asisten** | Mengelola lokasi dan radius laboratorium di Firestore, menentukan laboratorium untuk sesi praktikum, membuka/menutup sesi dan mengubah jadwal (yang memicu push notification ke praktikan), memeriksa serta memutuskan izin (yang memicu push notification ke pengaju), dan melihat peta laboratorium. |

### Alur Demo Wajib

**Alur 1: Presensi Berbasis Lokasi**
1. Asisten memastikan sesi praktikum telah terhubung dengan lokasi dan radius laboratorium di Firestore, lalu membuka sesi.
2. Praktikan membuka halaman detail sesi lalu menuju ke **halaman khusus presensi**.
3. Aplikasi meminta/memeriksa izin lokasi perangkat, mengambil koordinat GPS perangkat, dan menghitung jarak terhadap titik koordinat serta radius laboratorium.
4. Apabila praktikan berada di luar radius (atau lokasi tidak tersedia), aplikasi menampilkan status di luar radius dan menolak pencatatan presensi.
5. Apabila sesi sedang dibuka dan praktikan berada di dalam radius yang diizinkan, presensi berhasil dicatat ke Firestore beserta timestamp dan informasi lokasinya.
6. Asisten melihat rekap kehadiran praktikan secara real-time.

**Alur 2: Peta dan Informasi Laboratorium**
1. Pengguna membuka halaman **Maps (Peta Laboratorium)**.
2. Aplikasi menampilkan peta interaktif dengan marker posisi pengguna yang bergerak mengikuti perubahan lokasi perangkat serta marker seluruh laboratorium Informatika dari Firestore.
3. Pengguna memilih salah satu marker laboratorium pada peta.
4. Aplikasi menampilkan informasi laboratorium tersebut beserta kegiatan praktikum yang **sedang berlangsung** dan **praktikum berikutnya** (nama praktikum, kelas, waktu pelaksanaan, dan status sesi) secara real-time berdasarkan data Firestore.

**Alur 3: Notifikasi Kegiatan**
1. Perangkat pengguna telah memberikan izin notifikasi dan terdaftar untuk menerima pemberitahuan.
2. Asisten membuka sesi praktikum, mengubah jadwal sesi, atau memberikan keputusan (menerima/menolak) pada pengajuan izin praktikan.
3. Sistem memicu dan mengirimkan push notification kepada pengguna yang berkepentingan.
4. Perangkat praktikan menerima push notification yang menampilkan informasi perubahan tersebut, dan menekan notifikasi akan mengarahkan pengguna ke halaman aplikasi yang relevan.

## Validasi, Izin Perangkat, dan Keamanan

- **Validasi Lokasi Wajib dalam Proses Presensi**: Pemeriksaan radius lokasi bukan sekadar indikator visual di UI, melainkan bagian dari fungsi pencatatan presensi (`recordAttendance`). Presensi yang tidak memenuhi syarat status sesi (`open`), keunikan kehadiran, atau radius lokasi tidak akan dicatat ke Firestore.
- **Penanganan Kondisi Perangkat**: Menangani dan menampilkan pesan informatif saat izin lokasi/notifikasi ditolak pengguna, GPS/layanan lokasi perangkat mati, sinyal lokasi belum tersedia, koneksi internet terputus, atau token notifikasi gagal diperoleh.
- **Firebase Security Rules**: Hanya asisten yang berhak menambah, mengubah, atau menghapus data lokasi laboratorium (`laboratories/{labId}`), sedangkan praktikan hanya memiliki akses baca dan hanya dapat mencatat presensi miliknya sendiri ketika sesi terbuka.
