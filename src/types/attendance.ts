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

export type RecordAttendanceFailureReason =
  | 'session-not-open'
  | 'already-recorded'
  | 'user-not-found';

export type RecordAttendanceResult =
  | { ok: true; record: AttendanceRecord }
  | { ok: false; reason: RecordAttendanceFailureReason };

export type AttendanceContextValue = {
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
  ) => RecordAttendanceResult;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];
};
