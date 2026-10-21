# AGENTS.md — Sprint 1: UI Absensi Praktikum

## Tujuan sprint

Bangun prototipe aplikasi manajemen absensi praktikum menggunakan Expo + React Native + TypeScript + Expo Router. Fokus sprint ini adalah antarmuka, navigasi, dan interaksi yang responsif. Gunakan dummy data dan state lokal selama aplikasi berjalan; jangan menambahkan backend atau database.

Alur demo yang wajib dapat diperagakan:

1. Asisten memilih sesi dan membuka sesi.
2. Praktikan memilih sesi yang sama dan melakukan presensi.
3. Asisten membuka rekap dan melihat presensi beserta waktunya.
4. Asisten menutup sesi.

Karena tidak ada backend, semua perubahan boleh hilang ketika aplikasi dimuat ulang. Namun, selama satu runtime aplikasi, gunakan state bersama agar alur demo di atas benar-benar terlihat lintas peran. Tidak perlu membuat sinkronisasi atau persistensi antarperangkat.

## Aturan kerja untuk kedua agent

- Jangan mengubah file di luar daftar kepemilikan yang diberikan kepada agent masing-masing.
- Jangan mengedit file yang dimiliki agent lain, meskipun perubahan terasa kecil. Jika butuh perubahan kontrak, ajukan permintaan terlebih dahulu dan tunggu pemilik file yang mengubahnya.
- Jangan menambahkan dependency baru kecuali benar-benar diperlukan dan telah disepakati. Gunakan `Modal` dari React Native untuk konfirmasi/dukungan interaksi jika tidak ada Bottom Sheet yang sudah terpasang.
- Jangan mengubah `package.json`, `package-lock.json`, konfigurasi Expo, atau konfigurasi TypeScript untuk pekerjaan UI biasa. Jika perubahan konfigurasi diperlukan, hanya Agent 1 yang boleh melakukannya setelah memberi tahu Agent 2.
- Gunakan TypeScript, komponen fungsional, dan `StyleSheet`/pola styling yang sudah digunakan proyek. Gunakan Flexbox untuk tata letak dan pastikan tampilan dapat digunakan pada layar sempit maupun lebar.
- Jangan mengandalkan data hardcoded di dalam layar jika data tersebut seharusnya berasal dari context. Data identitas, sesi, dan presensi memakai kontrak bersama di bawah.
- Semua tombol harus memiliki aksi yang nyata. Sertakan loading/disabled state saat relevan, pesan keberhasilan/kegagalan yang mudah dipahami, serta empty state.
- Hindari `any`, duplikasi model data, penambahan library UI baru, dan perubahan besar yang tidak terkait sprint.
- Sebelum menyelesaikan pekerjaan, jalankan pemeriksaan yang tersedia seperti `npx tsc --noEmit` dan/atau lint jika skripnya tersedia. Laporkan command yang dijalankan dan masalah yang belum terselesaikan; jangan mengklaim lolos jika belum dijalankan.

## Pembagian kepemilikan file (wajib dipatuhi)

### Agent 1 — Fondasi aplikasi, state bersama, dan alur asisten

**Agent 1 satu-satunya pemilik file berikut:**

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/asisten/**`
- `src/components/asisten/**`
- `src/types/attendance.ts`
- `src/data/mockData.ts`
- `src/context/AttendanceContext.tsx`

Tugas Agent 1:

1. Buat kontrak tipe, dummy data, dan provider state bersama terlebih dahulu agar Agent 2 dapat mengembangkan layar praktikan terhadap API yang stabil.
2. Bungkus navigator root dengan `AttendanceProvider` di `_layout.tsx`.
3. Buat halaman awal `src/app/index.tsx` untuk memilih peran dan identitas pengguna menggunakan pilihan/form sederhana. Sediakan identitas dummy untuk asisten dan praktikan; setelah dipilih, navigasikan pengguna ke area sesuai perannya.
4. Implementasikan alur asisten: melihat jadwal/detail sesi, membuka sesi, melihat rekap presensi dan waktu kehadiran, lalu menutup sesi.
5. Pastikan perubahan status sesi terlihat pada layar asisten maupun praktikan melalui context yang sama.
6. Jangan mengubah file di dalam `src/app/praktikan/**` atau `src/components/praktikan/**`; Agent 2 memilikinya.

### Agent 2 — Alur praktikan

**Agent 2 satu-satunya pemilik file berikut:**

- `src/app/praktikan/**`
- `src/components/praktikan/**`

Tugas Agent 2:

1. Bangun layar jadwal/daftar sesi praktikan, detail sesi, tindakan presensi, dan riwayat presensi pribadi.
2. Ambil data dan lakukan perubahan melalui `useAttendance()` dari `src/context/AttendanceContext.tsx`. Jangan membuat context, state store, tipe, atau dummy data tandingan.
3. Tampilkan informasi nama praktikum, kelas, tanggal, jam, lokasi (jika tersedia), nama asisten (jika tersedia), dan status sesi.
4. Tombol presensi hanya aktif jika sesi berstatus `open` dan pengguna belum tercatat hadir pada sesi tersebut. Setelah berhasil, tampilkan waktu kehadiran dan umpan balik yang jelas.
5. Jika sesi belum dibuka atau sudah ditutup, jelaskan statusnya dan nonaktifkan presensi. Jika sudah presensi, tampilkan status “sudah presensi” dan cegah presensi kedua.
6. Buat halaman riwayat yang menampilkan catatan kehadiran milik praktikan yang sedang dipilih, serta empty state ketika belum ada catatan.
7. Jangan mengubah `_layout.tsx`, `src/app/index.tsx`, `src/app/asisten/**`, `src/types/attendance.ts`, `src/data/mockData.ts`, atau `src/context/AttendanceContext.tsx`.

## Kontrak integrasi yang disepakati

Agent 1 harus mengimplementasikan API dengan nama dan bentuk berikut. Agent 2 membaca dan menggunakan kontrak ini, bukan mendefinisikan ulang.

### Tipe (`src/types/attendance.ts`)

Definisikan sekurangnya tipe berikut:

```ts
export type UserRole = 'asisten' | 'praktikan';
export type SessionStatus = 'upcoming' | 'open' | 'closed';

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  nim?: string;
  className?: string;
};

export type PracticumSession = {
  id: string;
  practicalName: string;
  className: string;
  date: string;       // ISO date atau format tanggal yang disepakati
  startTime: string;  // format jam yang konsisten, mis. "09:00"
  endTime: string;
  room?: string;
  assistantName?: string;
  status: SessionStatus;
  participantIds?: string[];
};

export type AttendanceRecord = {
  sessionId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string; // ISO timestamp
};
```

Model boleh diperluas oleh Agent 1 jika dibutuhkan, tetapi nama field di atas tidak boleh diubah atau dihapus tanpa persetujuan kedua agent.

### API context (`src/context/AttendanceContext.tsx`)

Sediakan `AttendanceProvider` dan hook `useAttendance()`. Hook sekurangnya mengekspos:

```ts
{
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  assistants: AppUser[];
  students: AppUser[];
  sessions: PracticumSession[];
  attendanceRecords: AttendanceRecord[];
  openSession: (sessionId: string) => void;
  closeSession: (sessionId: string) => void;
  recordAttendance: (
    sessionId: string,
    studentId: string
  ) => { ok: true; record: AttendanceRecord } |
     { ok: false; reason: 'session-not-open' | 'already-recorded' | 'user-not-found' };
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];
}
```

Implementasi boleh menyimpan tambahan state internal, tetapi Agent 2 hanya mengandalkan kontrak ini. `recordAttendance` wajib memeriksa bahwa sesi terbuka, identitas praktikan ada, dan praktikan belum melakukan presensi untuk sesi itu. Simpan timestamp aktual saat tindakan dilakukan.

### Dummy data (`src/data/mockData.ts`)

- Sediakan beberapa sesi dengan status awal yang bervariasi (`upcoming`, `open`, `closed`) agar semua state UI bisa diuji.
- Sediakan beberapa identitas asisten dan praktikan, termasuk kelas/NIM dummy yang konsisten.
- Data awal presensi boleh berisi beberapa catatan contoh, tetapi minimal ada sesi yang masih kosong.
- Data harus fiktif; jangan memasukkan data pribadi nyata.

### Navigasi yang dipakai

- `/` — pemilihan peran dan identitas (Agent 1).
- `/asisten` — daftar jadwal/sesi asisten (Agent 1).
- `/asisten/[sessionId]` — detail, tindakan buka/tutup sesi, dan akses rekap (Agent 1).
- `/asisten/rekap/[sessionId]` — rekap sesi jika dibuat sebagai halaman terpisah (Agent 1); atau rekap berupa `Modal` pada detail sesi.
- `/praktikan` — daftar jadwal/sesi praktikan (Agent 2).
- `/praktikan/[sessionId]` — detail dan presensi (Agent 2).
- `/praktikan/riwayat` — riwayat presensi pribadi (Agent 2).

Gunakan Expo Router untuk navigasi. Jika rute belum tersedia saat agent sedang mengembangkan bagiannya, tetap gunakan path yang didefinisikan di atas.

## Kriteria selesai per agent

### Agent 1

- [ ] Halaman awal memungkinkan pengguna memilih peran dan identitas dummy.
- [ ] Root navigator dibungkus `AttendanceProvider` dan seluruh rute terkait dapat dibuka.
- [ ] Asisten dapat melihat daftar/detail jadwal.
- [ ] Asisten dapat membuka sesi dan status `open` muncul di UI.
- [ ] Asisten dapat melihat daftar presensi beserta waktu, termasuk empty state.
- [ ] Asisten dapat menutup sesi dan UI menunjukkan status `closed`.
- [ ] API context dan model mengikuti kontrak sehingga Agent 2 dapat menggunakannya.

### Agent 2

- [ ] Praktikan dapat melihat daftar jadwal dan detail sesi.
- [ ] Tombol presensi hanya aktif ketika sesi `open` dan belum presensi.
- [ ] Presensi sukses menampilkan feedback dan waktu kehadiran.
- [ ] Presensi kedua untuk sesi yang sama dicegah dan dijelaskan kepada pengguna.
- [ ] Sesi `upcoming`/`closed` memiliki UI nonaktif yang informatif.
- [ ] Praktikan dapat melihat riwayatnya sendiri dan empty state jika kosong.
- [ ] Semua pembacaan/perubahan data menggunakan API context yang telah disepakati.

## Aturan integrasi dan merge

1. Agent 1 terlebih dahulu membuat dan meng-commit `attendance.ts`, `mockData.ts`, serta kerangka `AttendanceContext.tsx` dengan API kontrak yang sudah stabil. Beri tahu Agent 2 ketika kontrak siap.
2. Kedua agent bekerja di branch terpisah. Agent 2 mengambil commit kontrak Agent 1, lalu hanya mengubah file yang menjadi kepemilikannya.
3. Agent 1 dan Agent 2 tidak boleh sama-sama mengubah file yang sama. Jangan melakukan refactor lintas kepemilikan tanpa kesepakatan eksplisit.
4. Jika kontrak ternyata kurang, Agent 2 membuat permintaan perubahan tertulis; Agent 1 mengubah file bersama, meng-commit perubahan, lalu Agent 2 mengambil commit tersebut.
5. Sebelum merge, masing-masing agent memeriksa `git status` dan diff, memastikan tidak ada file milik agent lain ikut berubah, lalu menjalankan pemeriksaan TypeScript yang tersedia.
6. Setelah kedua branch digabung, lakukan uji alur manual lintas peran pada satu runtime aplikasi: pilih identitas asisten → buka sesi → kembali ke pemilihan peran/pilih praktikan → presensi → pilih asisten kembali → periksa rekap → tutup sesi.

## Definisi selesai sprint

Sprint dianggap selesai jika alur demo wajib berhasil dalam satu runtime aplikasi, UI responsif, interaksi dan status jelas, kondisi kosong ditangani, presensi ganda dicegah, tidak ada backend/database, dan tidak ada konflik perubahan file antara kedua agent.
