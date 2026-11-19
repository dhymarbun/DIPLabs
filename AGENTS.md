# AGENTS.md — DIPLabs

# PERTEMUAN 1: UI Absensi Praktikum

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

# PERTEMUAN 2: Data Dinamis dengan Firebase

## Tujuan sprint

Mengembangkan aplikasi dari PERTEMUAN 1 menjadi aplikasi multi-pengguna dengan data dinamis: integrasikan Firebase Authentication untuk pengelolaan akun, Cloud Firestore untuk penyimpanan dan sinkronisasi data real-time, serta API model AI dari pengajar untuk klasifikasi alasan izin. Data tersimpan permanen, konsisten antar pengguna, dan aksesnya dibatasi sesuai peran.

Alur demo yang wajib dapat diperagakan:

1. Asisten login → membuka sesi → praktikan login di perangkat lain dan melakukan presensi → data tersimpan di Firestore → asisten melihat rekap kehadiran secara real-time → asisten menutup sesi.
2. Praktikan login → mengajukan izin dengan alasan ketidakhadiran → aplikasi memanggil API AI untuk klasifikasi alasan → asisten memeriksa daftar izin dan memberikan keputusan → praktikan melihat status pengajuannya secara real-time.

Kebutuhan yang harus dipenuhi:

1. Autentikasi pengguna: registrasi, login, logout via Firebase Authentication; setiap akun punya identitas dan peran (praktikan/asisten); UI menampilkan informasi dan tindakan sesuai peran.
2. Pengelolaan data praktikum: kelas, peserta, jadwal, dan sesi tersimpan di Firestore; asisten dapat CRUD; praktikan melihat jadwal/sesi yang berkaitan dengannya.
3. Presensi terintegrasi: praktikan presensi saat sesi dibuka asisten; data kehadiran tersimpan berdasarkan identitas praktikan dan sesi; presensi ganda dilarang.
4. Sinkronisasi real-time: perubahan status sesi, presensi, dan rekap terlihat tanpa restart aplikasi; data persisten setelah aplikasi ditutup.
5. Pengajuan izin: praktikan mengajukan izin untuk sesi tertentu dengan alasan; pengajuan tersimpan di Firestore dengan status yang dapat dipantau.
6. Integrasi AI: alasan izin dikirim ke API model AI pengajar untuk prediksi kategori; hasil klasifikasi ditampilkan sebagai informasi pendukung dan disimpan bersama pengajuan; AI tidak menentukan keputusan.
7. Pemeriksaan izin: asisten melihat daftar pengajuan beserta alasan dan hasil klasifikasi AI, lalu menerima atau menolak; keputusan tersimpan di Firestore dan terlihat oleh praktikan.
8. Validasi dan keamanan data: tangani input tidak valid, kegagalan autentikasi, gangguan komunikasi Firestore/API AI; akses dan perubahan data dibatasi sesuai identitas dan peran melalui Firebase Security Rules.

Perhatikan kondisi: pengguna belum login, data sedang dimuat (loading), daftar kosong (empty state), error jaringan/Firestore, dan layanan AI tidak merespons. Pengajuan izin tidak boleh otomatis diterima/ditolak berdasarkan prediksi AI.

Tentukan sendiri penyesuaian antarmuka, struktur data, dan alur interaksi yang diperlukan untuk memenuhi kebutuhan tersebut, selama kontrak integrasi di bawah dipatuhi.

## Aturan kerja untuk kedua agent

Aturan kerja PERTEMUAN 1 tetap berlaku, dengan tambahan berikut:

- Firebase Authentication adalah satu-satunya sumber identitas pengguna; jangan membuat identitas dummy atau login palsu di dalam aplikasi.
- Cloud Firestore adalah penyimpanan utama data; jangan menyimpan data aplikasi di state lokal saja atau di AsyncStorage.
- Jangan menuliskan secret, API key, atau kredensial apa pun ke dalam repository. Konfigurasi Firebase ditempatkan di file konfigurasi yang dikelola Agent 1; jika proyek menggunakan variabel lingkungan, gunakan mekanisme Expo yang sudah disepakati.
- Endpoint dan kunci API model AI dikelola melalui modul service milik Agent 1; Agent 2 tidak boleh memanggil API AI secara langsung dari komponen.
- Semua pembacaan/penulisan data melalui context/service yang disediakan Agent 1. Agent 2 tidak boleh membuat Firestore listener, query, atau model data tandingan.
- Firestore offline persistence wajib diaktifkan agar data tetap tersedia saat offline dan tersimpan permanen.
- Semua layar wajib menangani kondisi: belum login, data sedang dimuat, daftar kosong, error jaringan/Firestore, dan kegagalan API AI (fallback).
- Presensi ganda dicegah di sisi klien dan di sisi server (Firestore Security Rules dan/atau struktur dokumen).
- Hasil klasifikasi AI hanya informasi pendukung; keputusan penerimaan/penolakan izin hanya oleh asisten.
- Penambahan dependency baru (mis. `firebase`) dan perubahan konfigurasi hanya boleh dilakukan Agent 1 setelah memberitahu Agent 2.
- Sebelum menyelesaikan pekerjaan, jalankan `npx tsc --noEmit` dan laporkan hasilnya; jangan mengklaim lolos jika belum dijalankan.

## Pembagian kepemilikan file (wajib dipatuhi)

**Pemetaan Tanggung Jawab User Story (US):**
- **Agent 1**: Menangani **US-10**, **US-11**, **US-15**, **US-16**, **US-17**, **US-19**, serta menyediakan fondasi backend dan API context untuk **US-12**, **US-13**, **US-14**, dan **US-18**.
- **Agent 2**: Menangani antarmuka (UI) dan alur praktikan untuk **US-12**, **US-13**, **US-14**, dan **US-18** menggunakan kontrak context yang disediakan Agent 1.

### Agent 1 — Fondasi Firebase, autentikasi, state bersama, dan alur asisten

Agent 1 satu-satunya pemilik file berikut:

- `src/firebase/**` (inisialisasi Firebase, konfigurasi)
- `src/services/**` (Firestore CRUD, listener, AI service)
- `src/types/**` (semua tipe bersama)
- `src/context/**` (AuthContext, AttendanceContext, PermissionContext)
- `src/data/**` (seed data untuk pengembangan, jika diperlukan)
- `src/app/_layout.tsx`
- `src/app/index.tsx` (auth gate + navigasi berbasis peran)
- `src/app/auth/**` (login, register)
- `src/app/asisten/**` (jadwal, detail sesi, rekap, CRUD praktikum, daftar izin)
- `src/components/asisten/**`
- `src/components/auth/**` (jika ada)
- `src/components/shared/**` (jika ada)
- `firestore.rules` dan `firestore.indexes.json` (jika dibuat)

Tugas Agent 1:

1. Siapkan konfigurasi Firebase, inisialisasi SDK, dan modul service Firestore + AI.
2. Implementasikan AuthContext: registrasi, login, logout, listener perubahan auth state, pembuatan dokumen pengguna dengan peran.
3. Definisikan tipe bersama dan struktur Firestore; pastikan kontrak stabil sebelum Agent 2 mengembangkan layar praktikan.
4. Perluas AttendanceContext menjadi Firestore-backed dengan real-time listener untuk sesi dan presensi; sediakan CRUD sesi/kelas/peserta untuk asisten.
5. Buat PermissionContext: pengajuan izin (dipanggil praktikan), daftar izin, klasifikasi AI, keputusan asisten.
6. Implementasikan alur asisten: kelola data praktikum, buka/tutup sesi, rekap real-time, periksa dan putuskan izin.
7. Tulis dan deploy Firebase Security Rules sesuai peran; uji penolakan akses.
8. Pastikan perubahan status terlihat lintas peran dan lintas perangkat secara real-time.
9. Jangan mengubah file di `src/app/praktikan/**` atau `src/components/praktikan/**`; Agent 2 memilikinya.

### Agent 2 — Alur praktikan

Agent 2 satu-satunya pemilik file berikut:

- `src/app/praktikan/**`
- `src/components/praktikan/**`

Tugas Agent 2:

1. Bangun layar jadwal praktikan dengan data real-time dari context.
2. Detail sesi dan tindakan presensi; presensi hanya aktif saat sesi `open` dan belum presensi.
3. Layar pengajuan izin: pilih sesi, isi alasan, kirim; tampilkan hasil klasifikasi AI sebagai informasi pendukung.
4. Layar riwayat presensi dan riwayat/status pengajuan izin milik praktikan yang login.
5. Tangani loading, empty state, error, dan kondisi AI tidak merespons.
6. Ambil semua data melalui hook context yang disepakati; jangan membuat listener/query Firestore sendiri.
7. Jangan mengubah file milik Agent 1.

## Kontrak integrasi yang disepakati

### Tipe (`src/types/`)

```ts
export type UserRole = 'asisten' | 'praktikan';

export type AuthUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  nim?: string;
  className?: string;
};

export type SessionStatus = 'upcoming' | 'open' | 'closed';

export type PracticumClass = {
  id: string;
  name: string;
  assistantIds?: string[];
};

export type Participant = {
  classId: string;
  studentId: string;
  studentName: string;
  nim?: string;
};

export type PracticumSession = {
  id: string;
  classId?: string;
  practicalName: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  assistantId?: string;
  assistantName?: string;
  status: SessionStatus;
  participantIds?: string[];
};

export type AttendanceRecord = {
  sessionId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string;
};

export type PermissionStatus = 'pending' | 'approved' | 'rejected';

export type AIClassification = {
  category: string;
  confidence?: number;
};

export type AIClassificationResult = {
  category: string;
  confidence?: number;
};

export type PermissionRequest = {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  reason: string;
  aiCategory?: string;
  aiConfidence?: number;
  status: PermissionStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNote?: string;
};
```

```ts
// AuthContext API (disediakan oleh Agent 1)
{
  authUser: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: UserRole; nim?: string; className?: string }) => Promise<void>;
  logout: () => Promise<void>;
}
```

```ts
// AttendanceContext API (disediakan oleh Agent 1, real-time Firestore-backed)
{
  sessions: PracticumSession[];          // real-time (dipfilter berdasarkan peran)
  sessionsLoading: boolean;
  attendanceRecords: AttendanceRecord[]; // real-time
  openSession: (sessionId: string) => Promise<void>;
  closeSession: (sessionId: string) => Promise<void>;
  recordAttendance: (sessionId: string, studentId: string) => Promise<{ ok: true; record: AttendanceRecord } | { ok: false; reason: 'session-not-open' | 'already-recorded' | 'user-not-found' }>;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];
  addSession: (data: Omit<PracticumSession, 'id' | 'status'>) => Promise<void>;
  updateSession: (sessionId: string, data: Partial<PracticumSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addParticipant: (participant: Participant) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
}
```

```ts
// PermissionContext API (disediakan oleh Agent 1)
{
  myPermissions: PermissionRequest[];              // untuk praktikan (real-time)
  pendingPermissions: PermissionRequest[];         // untuk asisten (real-time)
  submitPermission: (sessionId: string, reason: string) => Promise<{ ok: boolean; error?: string; aiClassification?: AIClassification }>;
  reviewPermission: (requestId: string, decision: 'approved' | 'rejected', note?: string) => Promise<void>;
}
```

```ts
// AI Service (disediakan oleh Agent 1)
{
  classifyPermissionReason: (reason: string) => Promise<AIClassificationResult>;
}
```

### API Context

**AuthContext** (`src/context/AuthContext.tsx`): menyelenggarakan state otentikasi (`authUser`, `authLoading`), fungsi `login()`, `register()`, dan `logout()`. Hook: `useAuth()`.

**AttendanceContext** (`src/context/AttendanceContext.tsx`): menyelenggarakan state sesi dan presensi (real-time Firestore-backed). Fungsi mencakup `openSession`, `closeSession`, `recordAttendance`, `getAttendanceForSession`, `getAttendanceForStudent`, CRUD sesi dan peserta. Hook: `useAttendance()`.

**PermissionContext** (`src/context/PermissionContext.tsx`): menyelenggarakan state pengajuan izin (`myPermissions`, `pendingPermissions`), fungsi `submitPermission` (yang memanggil AI classify secara internal), dan `reviewPermission`. Hook: `usePermissions()`.

### Service AI (`src/services/ai.ts`)

Modul terpisah yang mengekspos `classifyPermissionReason(reason: string): Promise<AIClassificationResult>`. Jika API AI tidak merespons, hasil fallback ke `category: 'tidak_diketahui'` dan disimpan bersama pengajuan tanpa mengubah status izin secara otomatis.

### Struktur Firestore (disepakati)

- `users/{uid}` — `{ name, email, role, nim?, className? }`
- `classes/{classId}` — `{ name, ... }`
- `participants/{classId}_{studentId}` — `{ classId, studentId, studentName, nim? }` (struktur ID tetap agar mencegah duplikat)
- `sessions/{sessionId}` — sesuai `PracticumSession` (status, jadwal, asisten)
- `attendance/{sessionId}_{studentId}` — `{ sessionId, studentId, studentName, checkedInAt }`; ID unik `sessionId_studentId` mencegah presensi ganda; Security Rules membatasi hanya praktikan terkait yang dapat membuat dokorenya.
- `permissionRequests/{requestId}` — sesuai `PermissionRequest`; praktikan dapat membuat/membaca miliknya sendiri; asisten dapat membaca semua dan memperbarui status.

### Firebase Security Rules (prinsip dasar)

- Hanya pengguna terautentikasi (`auth.token.role` dan/atau `auth.uid`) yang dapat membaca/mengubah koleksi data terkini.
- `users`: tulis hanya untuk dokumen saat registrasi; role hanya boleh diatur sekali; baca untuk semua pengguna terautentikasi.
- `sessions`/`classes`/`participants`: baca untuk semua pengguna terautentikasi; tulis hanya asisten (`role == 'asisten'`).
- `attendance`: praktikan dapat membuat dokumen baru dengan ID `{sessionId}_{studentId}` hanya jika status sesi `open`; tidak dapat mengubah/menghapus; asisten dapat membaca semua; aturan mencegah `request.resource.data.studentId != auth.uid`.
- `permissionRequests`: praktikan dapat membuat dan membaca dokumen milik `auth.uid` saja; asisten dapat membaca seluruh koleksi dan memperbarui status (`status`, `reviewedAt`, `reviewedBy`, `reviewerNote`).

### Navigasi yang dipakai

- `/` — auth gate: belum login → `/auth/login`; sudah login → arahkan ke home peran berdasarkan role (Agent 1).
- `/auth/login`, `/auth/register` — layar autentikasi (Agent 1).
- `/asisten` — jadwal/sesi asisten + pintu CRUD praktikum (Agent 1).
- `/asisten/[sessionId]` — detail, buka/tutup sesi, rekap (Agent 1).
- `/asisten/rekap/[sessionId]` — rekap sesi (Agent 1).
- `/asisten/praktikum` — pengelolaan kelas/peserta/jadwal/sesi (Agent 1).
- `/asisten/izin` — daftar pengajuan izin + keputusan asisten (Agent 1).
- `/praktikan` — jadwal real-time (Agent 2).
- `/praktikan/[sessionId]` — detail + presensi + ajukan izin (Agent 2).
- `/praktikan/riwayat` — riwayat presensi (Agent 2).
- `/praktikan/izin` — riwayat dan status pengajuan izin (Agent 2).

Gunakan Expo Router untuk navigasi. Rute dapat disesuaikan selama kontrak hook terpenuhi, tetapi path di atas menjadi acuan.

## Kriteria selesai per agent

### Agent 1

- [ ] Konfigurasi Firebase terpasang tanpa secret di repository.
- [ ] Registrasi, login, logout berfungsi; role tersimpan dan terbaca melalui dokumen `users/{uid}`.
- [ ] Auth gate di `_layout.tsx`/`index.tsx` mengarahkan pengguna belum login ke layar auth; sudah login dialokasikan ke area peran.
- [ ] CRUD kelas, peserta, jadwal, sesi tersedia untuk asisten dan tersimpan di Firestore dengan struktur disepakati.
- [ ] Buka/tutup sesi memperbarui status di Firestore dan terlihat real-time di sisi praktikan melalui listener.
- [ ] Rekap presensi real-time menampilkan nama praktikan dan waktu kehadiran; empty state jika belum ada data.
- [ ] Daftar izin dengan alasan dan klasifikasi AI terlihat; asisten dapat menerima (`approved`) atau menolak (`rejected`); keputusan tersimpan di Firestore dan terlihat oleh praktikan.
- [ ] Firestore Security Rules diterapkan dan membatasi akses sesuai peran; presensi ganda dicegah di server melalui ID dokumen unik.
- [ ] Offline persistence aktif; error dan loading state ditangani di semua layar.
- [ ] Konteks/hook (AuthContext, AttendanceContext, PermissionContext) mengikuti kontrak sehingga Agent 2 dapat menggunakannya.

### Agent 2

- [ ] Praktikan melihat jadwal dan detail sesi secara real-time; loading dan empty state ditangani.
- [ ] Presensi hanya aktif saat sesi `open` dan belum presensi; sukses menampilkan waktu kehadiran; presensi ganda dicegah (client + server).
- [ ] Sesi `upcoming`/`closed` menonaktifkan presensi dengan penjelasan informatif.
- [ ] Praktikan dapat mengajukan izin dengan alasan; hasil klasifikasi AI ditampilkan sebagai informasi pendukung di bawah field alasan.
- [ ] Riwayat presensi dan status izin (pending/approved/rejected) terlihat real-time dengan empty state jika belum ada data.
- [ ] Kondisi belum login, loading, kosong, error jaringan, dan AI tidak merespons ditangani dengan UI fallback yang jelas.
- [ ] Semua data dibaca melalui hook context (useAuth, useAttendance, usePermissions) yang disepakati; tidak ada query/listener Firestore langsung di layar praktikan.

## Aturan integrasi dan merge

1. Agent 1 terlebih dahulu membuat dan meng-commit fondasi Firebase: tipe, service, context (AuthContext, AttendanceContext, PermissionContext), dan Security Rules. Beri tahu Agent 2 ketika kontrak siap.
2. Kedua agent bekerja di branch terpisah. Agent 2 mengambil commit kontrak Agent 1, lalu hanya mengubah file miliknya.
3. Tidak boleh mengubah file milik agent lain. Perubahan kontrak hanya oleh Agent 1 setelah permintaan tertulis dari Agent 2.
4. Sebelum merge, periksa `git status` dan diff; pastikan tidak ada file milik agent lain berubah; jalankan `npx tsc --noEmit`.
5. Setelah merge, uji dua alur demo lintas pengguna/perangkat: (a) asisten login → buka sesi → praktikan login & presensi → rekap real-time → tutup sesi; (b) praktikan login → ajukan izin → AI klasifikasi → asisten putuskan → praktikan lihat status.
6. Uji juga Security Rules: praktikan tidak dapat menulis data praktikum atau presensi ganda; pengguna tidak terautentikasi tidak dapat membaca data; AI gagal tidak mengubah keputusan izin.

## Definisi selesai sprint

Sprint dianggap selesai jika: dua alur demo berjalan lintas pengguna dan perangkat dalam satu proyek Firebase; data tersimpan permanen di Firestore dan konsisten real-time; CRUD praktikum tersedia untuk asisten; presensi ganda dicegah; pengajuan izin dengan klasifikasi AI berfungsi sebagai informasi pendukung; keputusan izin sepenuhnya oleh asisten; Security Rules membatasi akses sesuai peran; semua kondisi belum login/loading/kosong/error/AI down ditangani; dan tidak ada konflik kepemilikan file antar agent.

# PERTEMUAN 3: Validasi Lokasi, Peta Laboratorium, dan Push Notification

## Tujuan sprint

Mengembangkan aplikasi dari PERTEMUAN 2 dengan memanfaatkan lokasi perangkat (Geolocation), peta interaktif (Google Maps), dan pemberitahuan perangkat (Push Notification). Aplikasi harus memeriksa keberadaan fisik praktikan ketika melakukan presensi pada halaman khusus presensi, menampilkan persebaran lokasi laboratorium Informatika beserta aktivitas praktikumnya di atas peta secara real-time, serta memberikan push notification ketika terdapat informasi penting (pembukaan sesi, perubahan jadwal, dan keputusan izin).

Alur demo yang wajib dapat diperagakan:

1. **Presensi berbasis lokasi**: Asisten menetapkan lokasi/radius laboratorium dan membuka sesi → praktikan membuka halaman khusus presensi → aplikasi memeriksa lokasi perangkat dan radius laboratorium → presensi berhasil dicatat ke Firestore apabila memenuhi ketentuan → asisten melihat rekap kehadiran secara real-time.
2. **Peta dan informasi laboratorium**: Pengguna membuka halaman Maps → aplikasi menampilkan posisi pengguna secara real-time dan marker laboratorium dari Firestore → pengguna memilih marker laboratorium → aplikasi menampilkan praktikum yang sedang berlangsung dan praktikum berikutnya berdasarkan data Firestore.
3. **Notifikasi kegiatan**: Asisten membuka sesi, mengubah jadwal, atau memberikan keputusan pengajuan izin → sistem mengirimkan push notification → pengguna terkait menerima pemberitahuan mengenai perubahan tersebut.

Kebutuhan yang harus dipenuhi:

1. **Halaman presensi**: Sediakan halaman khusus presensi yang terpisah dari halaman detail sesi (`/praktikan/presensi/[sessionId]`). Praktikan melihat informasi sesi, status sesi, hasil pemeriksaan lokasi, serta melakukan presensi melalui halaman tersebut. (Opsional: presensi menggunakan QR Code yang ditampilkan asisten dan dipindai praktikan).
2. **Validasi lokasi presensi**: Gunakan lokasi GPS perangkat untuk memeriksa apakah praktikan berada dalam radius lokasi laboratorium yang ditentukan. Presensi hanya dapat dilakukan dan dicatat apabila sesi sedang dibuka (`open`), pengguna belum presensi pada sesi tersebut, dan perangkat berada dalam radius yang diizinkan. Tampilkan hasil pemeriksaan lokasi secara jelas, termasuk ketika pengguna berada di luar radius atau lokasi tidak dapat diperoleh.
3. **Pengelolaan lokasi laboratorium**: Setiap laboratorium memiliki informasi lokasi, koordinat (`latitude`, `longitude`), dan radius (`radiusMeters`) yang disimpan di Cloud Firestore (`laboratories/{labId}`). Asisten dapat menentukan lokasi dan radius yang berlaku untuk kegiatan praktikum.
4. **Peta laboratorium interaktif**: Sediakan halaman Maps yang menampilkan marker seluruh laboratorium Informatika dari Firestore serta marker lokasi perangkat pengguna yang diperbarui mengikuti perubahan lokasi perangkat selama halaman digunakan. Pengguna dapat memilih marker laboratorium untuk melihat detail laboratorium tersebut.
5. **Informasi aktivitas laboratorium**: Setiap laboratorium yang dipilih pada peta menampilkan informasi praktikum yang sedang berlangsung dan praktikum berikutnya berdasarkan data jadwal dan sesi di Firestore (nama praktikum, kelas, waktu pelaksanaan, serta status sesi). Perubahan jadwal atau status sesi harus tercermin secara real-time.
6. **Push notification**: Integrasikan push notification (menggunakan Firebase Cloud Messaging / `@react-native-firebase/messaging` dan `react-native-notify-kit`, atau mekanisme push notification React Native yang sesuai) untuk memberikan pemberitahuan kepada pengguna terkait ketika:
   - sesi praktikum dibuka oleh asisten,
   - jadwal praktikum mengalami perubahan,
   - pengajuan izin diterima (`approved`) atau ditolak (`rejected`) oleh asisten.
7. **Penanganan izin dan kondisi perangkat**: Aplikasi meminta izin akses lokasi dan notifikasi sesuai kebutuhan, serta menangani kondisi ketika pengguna menolak izin akses, layanan lokasi/GPS tidak aktif, lokasi belum tersedia, koneksi mengalami gangguan, atau notifikasi tidak dapat diterima dengan pesan antarmuka yang jelas.

## Aturan kerja untuk kedua agent

Aturan kerja PERTEMUAN 1 dan PERTEMUAN 2 tetap berlaku, dengan tambahan berikut:

- **Dilarang menggunakan dummy data**: Seluruh data laboratorium, jadwal, sesi, presensi, izin, dan notifikasi wajib menggunakan data nyata dari Cloud Firestore secara real-time. Jangan menggunakan array laboratorium dummy atau koordinat palsu yang di-hardcode di komponen.
- **Validasi lokasi bukan sekadar tampilan UI**: Pemeriksaan radius lokasi harus menjadi bagian dari logika eksekusi pencatatan presensi. Presensi yang tidak memenuhi ketentuan status sesi, keunikan kehadiran, atau radius lokasi tidak boleh dicatat ke Firestore.
- **Arsitektur 100% Disjoint dan True Non-Blocking (Tanpa Menunggu Commit Awal)**:
  - Kontrak dasar (`useAuth`, `useAttendance`, `usePermissions`, `PracticumSession`, `db`) **sudah tersedia di branch `main` dari Pertemuan 2**. Oleh karena itu, **Agent 2 tidak perlu menunggu commit kontrak awal dari Agent 1**, dan **Agent 1 tidak perlu menunggu Agent 2**. Kedua agent dapat langsung membuat branch masing-masing dari `main` dan bekerja paralel sejak menit pertama hingga selesai.
  - Agar tidak ada konflik file (`git conflict`) maupun ketergantungan kompilasi (`compile-time blocking`), tipe dan service baru untuk Pertemuan 3 dipisahkan ke file milik masing-masing agent:
    - **Agent 1** membuat `src/types/notification.ts` & `src/services/notifications.ts` (untuk Push Notification) serta mengelola CRUD koleksi Firestore `laboratories` dari sisi Asisten.
    - **Agent 2** membuat `src/types/location.ts` & `src/services/location.ts` (untuk GPS Geolocation, kalkulasi radius Haversine, pembacaan koleksi `laboratories`, dan fungsi wrapper validasi lokasi sebelum memanggil `recordAttendance`), halaman khusus presensi (`/praktikan/presensi/[sessionId]`), serta halaman Peta Laboratorium Interaktif (`/praktikan/maps` atau `/maps`).
  - Integrasi antara pekerjaan Agent 1 dan Agent 2 terjadi secara otomatis melalui **skema dokumen koleksi Firestore `laboratories/{labId}` dan `sessions/{sessionId}`** yang telah disepakati di bawah, serta hook `useAttendance()` yang sudah stabil dari Pertemuan 2.
- Jangan menuliskan API key (seperti Google Maps API Key atau kredensial Firebase) secara hardcoded di dalam kode sumber; gunakan variabel lingkungan (`.env` / konfigurasi native yang di-ignore dari git).
- Sebelum menyelesaikan pekerjaan, jalankan `npx tsc --noEmit` dan laporkan hasilnya secara jujur.

## Pembagian kepemilikan file (100% Disjoint & Non-Blocking)

**Pemetaan Tanggung Jawab User Story (US):**
- **Agent 1**: Menangani **US-22** (Pengelolaan lokasi & radius laboratorium oleh Asisten di Firestore), **US-25** & **US-26** (Sistem Push Notification untuk pembukaan sesi, perubahan jadwal, dan keputusan izin), serta **US-27** (Penanganan izin notifikasi perangkat & keamanan Firestore Rules).
- **Agent 2**: Menangani **US-20** (Halaman khusus presensi terpisah dari detail sesi), **US-21** (Validasi lokasi GPS & radius laboratorium saat presensi), **US-23** & **US-24** (Peta laboratorium interaktif & informasi aktivitas praktikum sedang berlangsung/berikutnya dari Firestore), serta **US-27** (Penanganan izin lokasi & kondisi GPS perangkat).

### Agent 1 — Pengelolaan Lokasi Laboratorium (Asisten) & Sistem Push Notification

**Agent 1 satu-satunya pemilik file berikut (tidak ada satu pun file yang beririsan dengan Agent 2):**

- `src/types/notification.ts` (tipe untuk Push Notification & tipe `Laboratory` sisi asisten)
- `src/services/notifications.ts` (setup FCM / `@react-native-firebase/messaging`, channel `react-native-notify-kit`, izin notifikasi, pengiriman/penampilan push notification, deep-link handler)
- `src/services/firestore.ts` (fungsi CRUD Firestore termasuk koleksi `laboratories` dan dokumen pemicu notifikasi)
- `src/context/NotificationContext.tsx` (state izin notifikasi, FCM token pengguna, listener notifikasi foreground/background)
- `src/context/AttendanceContext.tsx` & `src/context/PermissionContext.tsx` (menambahkan pemicu push notification saat `openSession`, `updateSession`, dan `reviewPermission` dijalankan, tanpa mengubah signature kontrak Pertemuan 2 yang dipakai Agent 2)
- `src/app/_layout.tsx` (membungkus aplikasi dengan `NotificationProvider`)
- `src/app/asisten/**` (pengelolaan lokasi/koordinat/radius laboratorium di `src/app/asisten/praktikum.tsx` atau `src/app/asisten/laboratorium.tsx`, detail sesi, rekap, izin)
- `src/components/asisten/**`
- `firestore.rules` dan `firestore.indexes.json`

Tugas Agent 1 (Dapat langsung dikerjakan tanpa menunggu Agent 2):

1. Buat `src/types/notification.ts` serta perluas `src/services/firestore.ts` untuk menyediakan fungsi CRUD koleksi Firestore `laboratories/{labId}` (`name`, `room`, `description`, `latitude`, `longitude`, `radiusMeters`, `updatedAt`).
2. Bangun antarmuka pengelolaan laboratorium bagi Asisten di `src/app/asisten/praktikum.tsx` (atau `src/app/asisten/laboratorium.tsx`) agar asisten dapat menambah, mengubah, dan menghapus laboratorium beserta titik koordinat (`latitude`, `longitude`) dan radius presensi (`radiusMeters`), serta memilih laboratorium/ruangan (`room`) saat membuat atau mengubah sesi praktikum. (Opsional: tampilkan QR Code sesi pada detail sesi asisten).
3. Implementasikan `src/services/notifications.ts` dan `src/context/NotificationContext.tsx`:
   - Meminta izin akses notifikasi perangkat (`POST_NOTIFICATIONS` / FCM permission), membuat Android notification channel, dan menyimpan FCM token ke dokumen `users/{uid}` di Firestore.
   - Memicu pengiriman/penampilan push notification kepada pengguna yang berkepentingan ketika:
     1. Asisten membuka sesi praktikum (`openSession`).
     2. Asisten mengubah jadwal/informasi sesi praktikum (`updateSession`).
     3. Asisten memberikan keputusan (`approved` / `rejected`) pada pengajuan izin praktikan (`reviewPermission`).
   - Menangani notifikasi saat aplikasi di foreground, background/killed, deep linking saat notifikasi ditekan, serta menampilkan informasi yang jelas apabila izin notifikasi ditolak atau gagal diterima.
4. Perbarui `firestore.rules` untuk mengamankan koleksi `laboratories/{labId}` (baca untuk semua pengguna terautentikasi, tulis hanya untuk asisten) serta koleksi/field notifikasi.
5. **Jangan mengubah** file di `src/app/praktikan/**`, `src/app/maps/**`, `src/components/praktikan/**`, `src/components/maps/**`, `src/types/location.ts`, atau `src/services/location.ts` milik Agent 2, serta jangan merusak signature fungsi `useAttendance()` / `usePermissions()` dari Pertemuan 2.

### Agent 2 — Halaman Khusus Presensi, Validasi Lokasi GPS, dan Peta Laboratorium Interaktif (Maps)

**Agent 2 satu-satunya pemilik file berikut (tidak ada satu pun file yang beririsan dengan Agent 1):**

- `src/types/location.ts` (tipe `GeoCoordinates`, `Laboratory`, `LocationPermissionStatus`, `LocationValidationResult`)
- `src/services/location.ts` (permintaan izin lokasi perangkat, pembacaan GPS `getCurrentPosition` & `watchPosition`, kalkulasi jarak Haversine `calculateDistanceMeters`, validasi radius terhadap laboratorium, serta listener real-time pembacaan koleksi `laboratories` dari Firestore)
- `src/app/praktikan/**` (daftar jadwal, detail sesi `src/app/praktikan/[sessionId].tsx`, **halaman khusus presensi** `src/app/praktikan/presensi/[sessionId].tsx`, riwayat, izin)
- `src/app/maps/**` (**halaman Peta Laboratorium Interaktif** `src/app/maps/index.tsx`)
- `src/components/praktikan/**`
- `src/components/maps/**` (marker laboratorium, marker pengguna, kartu/panel informasi praktikum yang sedang berlangsung dan praktikum berikutnya)

Tugas Agent 2 (100% Non-Blocking — dapat langsung dikerjakan dari `main` tanpa menunggu Agent 1):

1. Buat `src/types/location.ts` dan `src/services/location.ts` untuk:
   - Meminta dan memeriksa izin akses lokasi perangkat (`ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`).
   - Mengambil koordinat GPS perangkat saat ini dan memantau pergerakan lokasi perangkat secara real-time (`watchDeviceLocation`).
   - Membaca daftar laboratorium secara real-time dari koleksi Firestore `laboratories` (`subscribeLaboratories` / hook `useLaboratories()`), serta mencocokkan sesi praktikum dengan laboratoriumnya (berdasarkan `labId` atau nama ruangan `room`).
   - Menghitung jarak dalam meter antara posisi perangkat dan koordinat laboratorium menggunakan rumus Haversine (`calculateDistanceMeters`), serta memvalidasi apakah pengguna berada di dalam `radiusMeters` yang diizinkan.
2. Buat **Halaman Khusus Presensi** (`src/app/praktikan/presensi/[sessionId].tsx`) yang terpisah dari halaman detail sesi (`src/app/praktikan/[sessionId].tsx`):
   - Ubah halaman detail sesi (`src/app/praktikan/[sessionId].tsx`) agar mengarahkan praktikan ke halaman khusus presensi (`/praktikan/presensi/[sessionId]`) ketika ingin melakukan presensi.
   - Pada halaman khusus presensi, tampilkan informasi sesi, status sesi, nama & radius laboratorium acuan, jarak perangkat praktikan saat ini ke laboratorium, serta status hasil pemeriksaan lokasi (di dalam radius, di luar radius, izin lokasi ditolak, atau layanan lokasi tidak aktif/belum diperoleh).
   - Jadikan validasi lokasi sebagai syarat mutlak dalam fungsi eksekusi presensi: fungsi presensi wajib memeriksa izin & radius lokasi terlebih dahulu, menolak pencatatan jika sesi belum `open` atau jarak melebihi `radiusMeters`, dan hanya memanggil `useAttendance().recordAttendance(session.id, currentUser.id)` apabila validasi lokasi berhasil dan praktikan belum tercatat hadir. (Opsional: tambahkan pemindaian QR Code jika kelompok mengimplementasikan fitur opsional QR).
3. Buat **Halaman Peta Laboratorium Interaktif** (`src/app/maps/index.tsx` dan `src/components/maps/**`) menggunakan `react-native-maps`:
   - Tampilkan `MapView` dengan marker untuk setiap laboratorium Informatika dari koleksi Firestore `laboratories` serta marker lokasi perangkat pengguna yang terus diperbarui mengikuti perubahan lokasi perangkat selama halaman dibuka.
   - Ketika pengguna memilih salah satu marker laboratorium, tampilkan informasi laboratorium tersebut beserta:
     - **Praktikum yang sedang berlangsung** (sesi pada laboratorium/ruangan tersebut yang berstatus `open` atau sedang berlangsung).
     - **Praktikum berikutnya** (sesi `upcoming` berikutnya yang terjadwal di laboratorium/ruangan tersebut).
     - Tampilkan nama praktikum, kelas, waktu pelaksanaan (`date`, `startTime`–`endTime`), dan status sesi secara real-time berdasarkan `useAttendance().sessions`.
4. Sediakan tombol navigasi menuju halaman Maps (`/maps`) dari halaman praktikan.
5. Tangani seluruh kondisi perangkat dengan pesan yang jelas: izin lokasi ditolak, GPS tidak aktif, sinyal lokasi belum tersedia, pengguna berada di luar radius laboratorium, atau gangguan koneksi.
6. **Jangan mengubah** file milik Agent 1 (`src/app/_layout.tsx`, `src/app/asisten/**`, `src/context/**`, `src/services/firestore.ts`, `src/types/attendance.ts`, `firestore.rules`).

## Kontrak integrasi yang disepakati (Non-Blocking via Skema Firestore & Kontrak Pertemuan 2)

Karena kedua agent tidak mengedit file yang sama, titik temu integrasi keduanya adalah **skema dokumen Firestore `laboratories/{labId}`** dan **kontrak `useAttendance()` dari Pertemuan 2** yang sudah ada di `main`.

### 1. Skema Koleksi Firestore `laboratories/{labId}` (Ditulis oleh Asisten / Agent 1, Dibaca oleh Presensi & Maps / Agent 2)

Setiap dokumen di koleksi `laboratories/{labId}` wajib mengikuti struktur berikut:

```ts
export type Laboratory = {
  id: string;             // Document ID di koleksi 'laboratories'
  name: string;           // Nama laboratorium, mis. "Laboratorium Dasar 2"
  room: string;           // Nama ruangan yang berelasi dengan PracticumSession.room, mis. "Lab Dasar 2"
  description?: string;   // Deskripsi atau gedung/lantai laboratorium
  latitude: number;       // Koordinat latitude laboratorium (number)
  longitude: number;      // Koordinat longitude laboratorium (number)
  radiusMeters: number;   // Radius maksimum presensi dalam meter (number, mis. 50)
  updatedAt?: string;     // ISO timestamp
};
```

**Aturan Relasi Sesi ↔ Laboratorium:**
- Pada dokumen `sessions/{sessionId}` (`PracticumSession`), field `room` diisi dengan nilai `room` (atau `name`) dari `Laboratory` yang dipilih asisten (dan opsional `labId` berisi `id` dokumen `Laboratory`).
- Saat menentukan lokasi laboratorium untuk suatu sesi atau menampilkan aktivitas praktikum suatu laboratorium di Maps, pencocokan dilakukan dengan memeriksa `session.labId === lab.id` atau `session.room?.toLowerCase() === lab.room.toLowerCase()` atau `session.room?.toLowerCase() === lab.name.toLowerCase()`.

### 2. Skema Koleksi/Field Push Notification (Dikelola oleh Agent 1)

- `users/{uid}` — menyimpan field tambahan `fcmTokens?: string[]` atau `fcmToken?: string` saat perangkat memberikan izin notifikasi.
- `notifications/{notificationId}` — `{ recipientIds: string[], title: string, body: string, type: 'session_opened' | 'schedule_updated' | 'permission_reviewed', sessionId?: string, permissionId?: string, createdAt: string }`.

### 3. Kontrak Layanan Lokasi (`src/types/location.ts` & `src/services/location.ts` — Dikelola oleh Agent 2)

```ts
export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export type LocationCheckResult =
  | {
      ok: true;
      userCoords: GeoCoordinates;
      distanceMeters: number;
      radiusMeters: number;
    }
  | {
      ok: false;
      reason:
        | 'permission-denied'
        | 'location-disabled'
        | 'location-unavailable'
        | 'lab-location-not-configured'
        | 'out-of-radius';
      distanceMeters?: number;
      radiusMeters?: number;
      message: string;
    };
```

### Navigasi yang dipakai

- `/praktikan/[sessionId]` — detail sesi praktikan + pengajuan izin + tombol menuju halaman khusus presensi (Agent 2).
- `/praktikan/presensi/[sessionId]` — **halaman khusus presensi** dengan pemeriksaan izin lokasi, indikator jarak & radius laboratorium, serta eksekusi presensi berbasis lokasi (Agent 2).
- `/maps` — **halaman Peta Laboratorium Interaktif** dengan marker seluruh laboratorium, marker posisi pengguna real-time, serta informasi praktikum yang sedang berlangsung dan praktikum berikutnya pada laboratorium yang dipilih (Agent 2).
- `/asisten/praktikum` (atau `/asisten/laboratorium`) — pengelolaan kelas, peserta, sesi, serta pengelolaan lokasi & radius laboratorium di Firestore (Agent 1).

## Kriteria selesai per agent

### Agent 1

- [ ] Asisten dapat menambah, melihat, mengubah, dan menghapus data lokasi laboratorium (`name`, `room`, `latitude`, `longitude`, `radiusMeters`) yang tersimpan langsung di koleksi Firestore `laboratories` tanpa dummy data.
- [ ] Asisten dapat menghubungkan sesi praktikum dengan laboratorium/ruangan sehingga sesi memiliki acuan koordinat dan radius presensi.
- [ ] Push notification terintegrasi untuk ketiga peristiwa wajib: (1) sesi praktikum dibuka, (2) jadwal praktikum mengalami perubahan, dan (3) pengajuan izin diterima (`approved`) atau ditolak (`rejected`) oleh asisten.
- [ ] Aplikasi meminta izin akses notifikasi pada perangkat serta menampilkan status/penanganan yang jelas apabila izin notifikasi ditolak atau notifikasi tidak dapat diterima.
- [ ] `firestore.rules` diperbarui untuk memberikan hak baca `laboratories` kepada semua pengguna terautentikasi dan membatasi hak tulis `laboratories` hanya untuk asisten.
- [ ] Seluruh kode berada di dalam daftar kepemilikan file Agent 1 dan lulus `npx tsc --noEmit`.

### Agent 2

- [ ] Layanan lokasi perangkat (`src/services/location.ts`) meminta izin lokasi, mengambil koordinat GPS nyata perangkat, memantau perubahan posisi pengguna, membaca koleksi `laboratories` dari Firestore secara real-time, dan menghitung jarak Haversine ke laboratorium.
- [ ] Halaman khusus presensi (`/praktikan/presensi/[sessionId]`) terpisah dari halaman detail sesi (`/praktikan/[sessionId]`), menampilkan informasi sesi, status sesi, jarak pengguna ke laboratorium, serta hasil pemeriksaan radius lokasi.
- [ ] Validasi lokasi menjadi bagian wajib dari proses pencatatan presensi: kehadiran hanya dapat dicatat melalui `recordAttendance` apabila sesi berstatus `open`, praktikan belum presensi, dan perangkat terbukti berada di dalam radius laboratorium yang diizinkan.
- [ ] Halaman Maps (`/maps`) menampilkan marker seluruh laboratorium Informatika dari Firestore serta marker lokasi pengguna yang bergerak mengikuti perubahan lokasi perangkat selama halaman dibuka.
- [ ] Memilih marker laboratorium pada peta menampilkan detail laboratorium beserta informasi praktikum yang **sedang berlangsung** dan **praktikum berikutnya** (nama praktikum, kelas, waktu pelaksanaan, status sesi) secara real-time dari data Firestore.
- [ ] Kondisi ketika pengguna menolak izin lokasi, layanan lokasi/GPS tidak aktif, lokasi belum tersedia, berada di luar radius, atau gangguan jaringan ditangani dengan pesan UI yang informatif.
- [ ] Tidak menggunakan dummy data; seluruh kode berada di dalam daftar kepemilikan file Agent 2 dan lulus `npx tsc --noEmit`.

## Aturan integrasi dan merge (True Non-Blocking Workflow)

1. **Mulai Paralel Tanpa Menunggu**: Kedua agent langsung membuat branch kerja masing-masing dari `main` saat ini. Tidak ada agent yang perlu menunggu commit awal dari agent lain karena kontrak `useAuth`, `useAttendance`, `usePermissions`, dan `db` sudah tersedia di `main`, serta skema dokumen Firestore `laboratories/{labId}` sudah dikunci di atas.
2. **Isolasi File Ketat**:
   - Agent 1 hanya mengedit file milik Agent 1 (`src/types/notification.ts`, `src/services/notifications.ts`, `src/services/firestore.ts`, `src/context/**`, `src/app/_layout.tsx`, `src/app/asisten/**`, `src/components/asisten/**`, `firestore.rules`).
   - Agent 2 hanya mengedit file milik Agent 2 (`src/types/location.ts`, `src/services/location.ts`, `src/app/praktikan/**`, `src/app/maps/**`, `src/components/praktikan/**`, `src/components/maps/**`).
3. Sebelum membuat Pull Request / merge, masing-masing agent memeriksa `git status` dan `git diff` untuk memastikan tidak ada file milik agent lain yang tersentuh, serta menjalankan `npx tsc --noEmit`.
4. Kedua branch dapat di-merge ke `main` dalam urutan apa pun (Agent 1 dulu atau Agent 2 dulu) tanpa menghasilkan merge conflict.
5. Setelah kedua branch digabung, uji ketiga alur demo wajib: (a) presensi berbasis lokasi di dalam dan di luar radius laboratorium; (b) peta interaktif laboratorium beserta informasi praktikum aktif dan berikutnya; (c) penerimaan push notification saat sesi dibuka, jadwal diubah, dan keputusan izin diberikan.

## Definisi selesai sprint

Sprint 3 dianggap selesai jika ketiga alur demo wajib (presensi berbasis lokasi pada halaman khusus presensi, peta laboratorium interaktif beserta informasi aktivitas praktikum real-time, dan push notification untuk pembukaan sesi/perubahan jadwal/keputusan izin) berjalan secara end-to-end menggunakan data Cloud Firestore dan sensor perangkat nyata (tanpa dummy data), seluruh kondisi izin perangkat dan error ditangani dengan jelas, presensi di luar radius dan presensi ganda dicegah, serta tidak ada konflik kepemilikan file antara Agent 1 dan Agent 2.
