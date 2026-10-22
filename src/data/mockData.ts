import {
  AppUser,
  AttendanceRecord,
  PracticumSession,
} from '../types/attendance';

export const MOCK_ASSISTANTS: AppUser[] = [
  {
    id: 'ast-01',
    name: 'Raka Pratama',
    role: 'asisten',
    nim: '13522011',
    className: 'K-01',
  },
  {
    id: 'ast-02',
    name: 'Nadia Kusuma',
    role: 'asisten',
    nim: '13522048',
    className: 'K-02',
  },
  {
    id: 'ast-03',
    name: 'Dimas Arya Wijaya',
    role: 'asisten',
    nim: '13522089',
    className: 'K-01',
  },
];

export const MOCK_STUDENTS: AppUser[] = [
  {
    id: 'std-01',
    name: 'Alya Putri Maharani',
    role: 'praktikan',
    nim: '13523005',
    className: 'K-01',
  },
  {
    id: 'std-02',
    name: 'Bima Satria Nugraha',
    role: 'praktikan',
    nim: '13523019',
    className: 'K-01',
  },
  {
    id: 'std-03',
    name: 'Citra Lestari Dewi',
    role: 'praktikan',
    nim: '13523034',
    className: 'K-01',
  },
  {
    id: 'std-04',
    name: 'Fajar Ramadhan Putra',
    role: 'praktikan',
    nim: '13523062',
    className: 'K-02',
  },
  {
    id: 'std-05',
    name: 'Gita Savitri Ananda',
    role: 'praktikan',
    nim: '13523077',
    className: 'K-02',
  },
];

export const MOCK_SESSIONS: PracticumSession[] = [
  {
    id: 'ses-01',
    practicalName: 'Modul 1: Pengenalan Pengolahan Citra Digital',
    className: 'K-01',
    date: '2026-10-22',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Lab Dasar 2 (Gedung Labtek V Lt. 3)',
    assistantName: 'Raka Pratama',
    status: 'upcoming',
    participantIds: ['std-01', 'std-02', 'std-03'],
  },
  {
    id: 'ses-02',
    practicalName: 'Modul 2: Transformasi Intensitas & Spatial Filtering',
    className: 'K-01',
    date: '2026-10-22',
    startTime: '10:00',
    endTime: '12:00',
    room: 'Lab Dasar 2 (Gedung Labtek V Lt. 3)',
    assistantName: 'Raka Pratama',
    status: 'open',
    participantIds: ['std-01', 'std-02', 'std-03'],
  },
  {
    id: 'ses-03',
    practicalName: 'Modul 2: Transformasi Intensitas & Spatial Filtering',
    className: 'K-02',
    date: '2026-10-22',
    startTime: '13:00',
    endTime: '15:00',
    room: 'Lab Multimedia (Gedung Labtek V Lt. 4)',
    assistantName: 'Nadia Kusuma',
    status: 'upcoming',
    participantIds: ['std-04', 'std-05'],
  },
  {
    id: 'ses-04',
    practicalName: 'Modul 0: Orientasi Lingkungan Praktikum & Tools',
    className: 'K-01',
    date: '2026-10-15',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Lab Dasar 1 (Gedung Labtek V Lt. 2)',
    assistantName: 'Dimas Arya Wijaya',
    status: 'closed',
    participantIds: ['std-01', 'std-02', 'std-03'],
  },
];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    sessionId: 'ses-04',
    studentId: 'std-01',
    studentName: 'Alya Putri Maharani',
    checkedInAt: '2026-10-15T09:04:18.000Z',
  },
  {
    sessionId: 'ses-04',
    studentId: 'std-02',
    studentName: 'Bima Satria Nugraha',
    checkedInAt: '2026-10-15T09:08:42.000Z',
  },
  {
    sessionId: 'ses-02',
    studentId: 'std-03',
    studentName: 'Citra Lestari Dewi',
    checkedInAt: '2026-10-22T03:05:12.000Z',
  },
];
