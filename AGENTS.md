# AGENTS.md — Sprint 1: UI Absensi Praktikum (3 Agents)

## Tujuan sprint

Bangun prototipe aplikasi manajemen absensi praktikum menggunakan Expo + React Native + TypeScript + Expo Router. Fokus sprint ini adalah UI, navigasi, dan interaksi yang responsif. Gunakan dummy data dan state lokal selama aplikasi berjalan; jangan menambahkan backend atau database.

Alur demo wajib dalam satu runtime aplikasi:

1. Pengguna memilih identitas asisten.
2. Asisten membuka sesi praktikum.
3. Pengguna berganti identitas ke praktikan.
4. Praktikan melakukan presensi.
5. Pengguna berganti kembali ke identitas asisten.
6. Asisten melihat rekap beserta waktu presensi, lalu menutup sesi.

Karena belum ada backend, data tidak perlu bertahan setelah aplikasi ditutup atau dimuat ulang. Namun, perubahan harus dibagikan melalui state/context yang sama selama aplikasi berjalan agar alur demo lintas peran dapat diperagakan.

## Aturan umum untuk semua agent

- **Patuhi kepemilikan file.** Jangan mengubah file yang dimiliki agent lain, walaupun hanya satu baris.
- Jangan mengubah `package.json`, lockfile, konfigurasi Expo, atau konfigurasi TypeScript untuk pekerjaan UI biasa. Perubahan dependency/konfigurasi harus disepakati terlebih dahulu; Agent 1 yang menerapkannya.
- Jangan membuat backend, database, API server, autentikasi sungguhan, atau persistensi yang tidak diminta.
- Gunakan TypeScript, komponen fungsional, Expo Router, Flexbox, dan pola styling yang sudah ada di proyek. Jangan menambahkan library UI baru tanpa persetujuan.
- Gunakan `Modal` dari React Native untuk konfirmasi/informasi pendukung jika diperlukan dan belum ada Bottom Sheet yang terpasang.
- Semua tombol harus memiliki aksi yang jelas. Tangani loading/disabled state yang relevan, feedback sukses/gagal, empty state, dan tampilan sesi yang belum dibuka atau sudah ditutup.
- Data identitas, sesi, dan presensi harus diambil dari `useAttendance()`; jangan membuat data/context/store lokal tandingan untuk informasi yang sama.
- Agent fitur boleh membuat komponen di dalam folder miliknya sendiri, tetapi tidak boleh mengubah shared component atau kontrak data.
- Hindari `any`, duplikasi model, refactor yang tidak terkait, dan file dengan tanggung jawab ganda.
- Sebelum menyelesaikan tugas, jalankan pemeriksaan yang tersedia (misalnya `npx tsc --noEmit` dan/atau lint jika script-nya ada). Laporkan command yang benar-benar dijalankan dan masalah yang masih ada.

## Pembagian agent dan kepemilikan file

Pembagian ini sengaja memakai tiga wilayah eksklusif: fondasi/shared state, UI asisten, dan UI praktikan. Jangan memindahkan tanggung jawab file tanpa kesepakatan eksplisit.

### Agent 1 — Fondasi, navigasi root, kontrak data, dan state bersama

**Hanya Agent 1 yang boleh membuat atau mengubah file berikut:**

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/components/shared/**`
- `src/types/attendance.ts`
- `src/data/mockData.ts`
- `src/context/AttendanceContext.tsx`

Agent 1 bertanggung jawab atas:

1. Memeriksa struktur proyek yang ada, lalu menyiapkan folder/file yang tercantum di atas jika belum ada.
2. Mendefinisikan tipe data, dummy data, dan `AttendanceContext` yang menjadi satu-satunya sumber state selama aplikasi berjalan.
3. Membungkus root navigator dengan `AttendanceProvider` pada `_layout.tsx`.
4. Membangun halaman awal `src/app/index.tsx` untuk memilih peran dan identitas dummy melalui form/pilihan sederhana. Setelah dipilih, arahkan pengguna ke area sesuai peran.
5. Menyediakan fungsi ganti pengguna/peran agar alur demo dapat berpindah dari asisten ke praktikan lalu kembali ke asisten tanpa kehilangan state sesi/presensi.
6. Jika perlu, membuat komponen reusable generik di `src/components/shared/**` (misalnya status badge, empty state, atau komponen informasi sesi). Komponen shared tidak boleh berisi alur khusus asisten atau praktikan.
7. Menyampaikan kontrak API yang siap dipakai kepada Agent 2 dan Agent 3 sebelum mereka mengintegrasikan UI.

**Agent 1 tidak boleh mengubah:**

- `src/app/asisten/**`
- `src/components/asisten/**`
- `src/app/praktikan/**`
- `src/components/praktikan/**`

### Agent 2 — UI dan alur asisten

**Hanya Agent 2 yang boleh membuat atau mengubah file berikut:**

- `src/app/asisten/**`
- `src/components/asisten/**`

Agent 2 bertanggung jawab atas:

1. Membuat daftar jadwal/sesi yang relevan untuk asisten, termasuk nama praktikum, kelas, tanggal, waktu, ruangan (jika tersedia), dan status.
2. Membuat halaman detail sesi dan tindakan membuka sesi yang belum dibuka serta menutup sesi yang sedang terbuka.
3. Menampilkan status terbaru sesi pada UI berdasarkan state bersama.
4. Membuat rekap sederhana berupa daftar praktikan yang sudah presensi beserta waktu kehadirannya. Sertakan empty state jika belum ada presensi.
5. Menambahkan konfirmasi menggunakan `Modal` bila tindakan membuka/menutup sesi perlu dikonfirmasi.
6. Menyediakan akses untuk mengganti pengguna/peran melalui navigasi ke `/` tanpa menghapus state sesi/presensi.
7. Menggunakan fungsi dan data dari `useAttendance()`; jangan membuat daftar kehadiran atau status sesi yang hanya hidup di state layar.

**Agent 2 tidak boleh mengubah:**

- File milik Agent 1.
- `src/app/praktikan/**`
- `src/components/praktikan/**`

### Agent 3 — UI dan alur praktikan

**Hanya Agent 3 yang boleh membuat atau mengubah file berikut:**

- `src/app/praktikan/**`
- `src/components/praktikan/**`

Agent 3 bertanggung jawab atas:

1. Membuat daftar jadwal/sesi praktikan dan halaman detailnya.
2. Menampilkan nama praktikum, kelas, tanggal, waktu, ruangan (jika tersedia), nama asisten (jika tersedia), dan status sesi.
3. Menampilkan tindakan presensi yang aktif hanya ketika sesi berstatus `open` dan praktikan belum presensi pada sesi itu.
4. Setelah presensi berhasil, menampilkan feedback yang jelas serta waktu presensi.
5. Mencegah presensi ganda dengan memanggil fungsi `recordAttendance()` dari context. Tampilkan pesan yang sesuai jika sesi belum terbuka atau presensi sudah tercatat.
6. Membuat riwayat presensi pribadi berdasarkan identitas praktikan yang sedang dipilih, termasuk empty state jika belum ada catatan.
7. Menyediakan akses untuk mengganti pengguna/peran melalui navigasi ke `/` tanpa menghapus state sesi/presensi.
8. Menggunakan fungsi dan data dari `useAttendance()`; jangan membuat daftar sesi/riwayat palsu yang terpisah dari state bersama.

**Agent 3 tidak boleh mengubah:**

- File milik Agent 1.
- `src/app/asisten/**`
- `src/components/asisten/**`

## Kontrak integrasi wajib

Kontrak di bawah adalah milik Agent 1. Agent 2 dan Agent 3 hanya membaca dan menggunakan kontrak ini. Jangan mengganti nama field atau bentuk fungsi tanpa meminta persetujuan Agent 1 terlebih dahulu.

### Tipe — `src/types/attendance.ts`

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
  date: string;
  startTime: string;
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
  checkedInAt: string;
};
```

Field `date` harus konsisten (disarankan ISO date seperti `2026-10-21`); `checkedInAt` adalah ISO timestamp. Agent 1 boleh menambahkan field, tetapi jangan menghapus atau mengganti field kontrak di atas.

### Context — `src/context/AttendanceContext.tsx`

Sediakan `AttendanceProvider` dan hook `useAttendance()`. API minimum:

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
  ) =>
    | { ok: true; record: AttendanceRecord }
    | {
        ok: false;
        reason: 'session-not-open' | 'already-recorded' | 'user-not-found';
      };
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];
}
```

Ketentuan implementasi:

- `openSession()` mengubah status sesi menjadi `open`.
- `closeSession()` mengubah status sesi menjadi `closed`.
- `recordAttendance()` wajib memeriksa sesi ada dan sedang terbuka, identitas praktikan valid, serta tidak ada catatan presensi sebelumnya untuk pasangan `sessionId` + `studentId` tersebut.
- Jika berhasil, simpan timestamp aktual dan kembalikan record yang baru dibuat.
- Perubahan dilakukan secara immutable agar React merender ulang UI yang memakai context.
- Fungsi selector mengembalikan daftar catatan berdasarkan sesi atau praktikan.
- `AttendanceProvider` harus berada di root agar state tidak hilang ketika pengguna berpindah route.

### Dummy data — `src/data/mockData.ts`

- Sediakan beberapa identitas asisten dan praktikan yang sepenuhnya fiktif.
- Sediakan beberapa sesi dengan status awal bervariasi: `upcoming`, `open`, dan `closed`.
- Sediakan sedikit data presensi contoh dan setidaknya satu sesi tanpa presensi.
- Pastikan setidaknya ada satu sesi yang dapat digunakan untuk demo alur buka sesi → presensi → rekap → tutup sesi.
- Jangan menyimpan state runtime yang bisa berubah di dalam file dummy data; file ini hanya berisi data awal.

## Konvensi navigasi

Pakai Expo Router dengan path berikut, kecuali struktur template yang sudah ada mengharuskan penyesuaian kecil. Jika perlu penyesuaian, sepakati sebelum mengubah kontrak navigasi.

- `/` — pemilihan peran/identitas, dimiliki Agent 1.
- `/asisten` — daftar jadwal/sesi asisten, dimiliki Agent 2.
- `/asisten/[sessionId]` — detail sesi dan kontrol buka/tutup, dimiliki Agent 2.
- `/asisten/rekap/[sessionId]` — rekap sesi jika dibuat sebagai halaman terpisah, dimiliki Agent 2; alternatifnya rekap boleh menggunakan `Modal` di detail sesi.
- `/praktikan` — daftar jadwal/sesi praktikan, dimiliki Agent 3.
- `/praktikan/[sessionId]` — detail dan presensi, dimiliki Agent 3.
- `/praktikan/riwayat` — riwayat presensi pribadi, dimiliki Agent 3.

Semua halaman fitur harus memiliki cara yang jelas untuk kembali ke daftar sebelumnya dan/atau mengganti identitas ke `/`. Perpindahan route tidak boleh membuat ulang provider state.

## Urutan kerja agar minim konflik

1. **Agent 1 mulai lebih dahulu.** Buat tipe, dummy data, dan context berdasarkan kontrak di dokumen ini. Buat root layout serta halaman pemilihan identitas. Commit pekerjaan fondasi dengan pesan commit yang jelas.
2. Agent 1 mengumumkan bahwa kontrak API sudah stabil dan memberi tahu Agent 2 serta Agent 3 commit mana yang harus mereka gunakan.
3. **Agent 2 dan Agent 3 bekerja secara paralel** pada folder masing-masing setelah commit fondasi tersedia. Mereka tidak mengubah file bersama atau folder fitur agent lain.
4. Jika Agent 2/3 membutuhkan API tambahan, ajukan permintaan singkat kepada Agent 1. Agent 1 mengubah file bersama dan membuat commit terpisah; kedua agent fitur mengambil commit tersebut. Jangan membuat workaround dengan mendefinisikan ulang state atau tipe di folder fitur.
5. Setiap agent memeriksa `git status` dan `git diff` sebelum commit. Pastikan hanya file yang dimiliki agent tersebut yang berubah.
6. Merge branch fondasi Agent 1 terlebih dahulu, lalu merge branch fitur Agent 2 dan Agent 3. Karena folder kepemilikan berbeda, konflik isi file harus dihindari. Jika konflik terjadi, jangan asal memilih “ours/theirs”; periksa penyebab dan pertahankan batas kepemilikan.
7. Setelah integrasi, jalankan pemeriksaan TypeScript/lint yang tersedia dan tes alur manual end-to-end.

## Checklist selesai per agent

### Agent 1 — Fondasi

- [ ] Root layout membungkus navigator dengan `AttendanceProvider`.
- [ ] Halaman awal memungkinkan pemilihan peran dan identitas dummy.
- [ ] State sesi dan presensi dibagi lintas route dalam satu runtime.
- [ ] API context sesuai kontrak dan mencegah presensi ganda.
- [ ] Data awal mendukung status kosong, terbuka, dan tertutup.
- [ ] Komponen shared (jika dibuat) tidak mengandung alur bisnis khusus peran.

### Agent 2 — Asisten

- [ ] Asisten dapat melihat jadwal dan detail sesi.
- [ ] Asisten dapat membuka sesi dan melihat status terbaru.
- [ ] Asisten dapat melihat rekap presensi lengkap dengan waktu kehadiran.
- [ ] Empty state rekap terlihat ketika belum ada yang presensi.
- [ ] Asisten dapat menutup sesi dan UI mencerminkan perubahan.
- [ ] Dapat kembali ke `/` untuk memilih praktikan tanpa menghilangkan state.

### Agent 3 — Praktikan

- [ ] Praktikan dapat melihat jadwal dan detail sesi.
- [ ] Tombol presensi hanya aktif ketika sesi terbuka dan praktikan belum presensi.
- [ ] Presensi berhasil memberi feedback dan menunjukkan waktu kehadiran.
- [ ] Presensi ganda dicegah dan diberi pesan yang sesuai.
- [ ] Sesi belum dibuka/ditutup menjelaskan alasan presensi tidak tersedia.
- [ ] Riwayat pribadi dan empty state berfungsi berdasarkan identitas yang dipilih.
- [ ] Dapat kembali ke `/` untuk memilih asisten tanpa menghilangkan state.

## Definisi selesai sprint

Sprint selesai jika alur ini berfungsi di satu runtime aplikasi: pilih asisten → buka sesi → pilih praktikan → presensi → pilih asisten kembali → lihat rekap → tutup sesi. UI harus responsif, semua aksi memiliki feedback, daftar kosong/sesi belum dibuka/sesi sudah ditutup ditangani, presensi ganda dicegah, tidak ada backend/database, dan setiap agent hanya mengubah file yang menjadi tanggung jawabnya.
