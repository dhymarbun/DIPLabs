import { Laboratory } from './notification';

export type UserRole = 'asisten' | 'praktikan';

export type AuthUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  nim?: string;
  className?: string;
};

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  nim?: string;
  className?: string;
  email?: string;
};

export type SessionStatus = 'upcoming' | 'open' | 'closed';

export type PracticumClass = {
  id: string;
  name: string;
  assistantIds?: string[];
};

export type ClassMergeSummary = {
  mergedGroups: number;
  removedClasses: number;
  movedParticipants: number;
  updatedSessions: number;
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
  labId?: string;
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
  checkedInAt: string; // ISO timestamp
  assistantId?: string;
  nim?: string;
  className?: string;
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
  assistantId?: string;
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

export type RecordAttendanceFailureReason =
  | 'session-not-open'
  | 'already-recorded'
  | 'user-not-found';

export type RecordAttendanceResult =
  | { ok: true; record: AttendanceRecord }
  | { ok: false; reason: RecordAttendanceFailureReason };

export type HybridRecordAttendanceReturn = Promise<RecordAttendanceResult> &
  RecordAttendanceResult;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  nim: string;
  className: string;
};

export type AuthContextValue = {
  authUser: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

export type AttendanceContextValue = {
  // Pertemuan 2 Firestore real-time contract
  sessions: PracticumSession[];
  sessionsLoading: boolean;
  attendanceRecords: AttendanceRecord[];
  openSession: (sessionId: string) => Promise<void>;
  closeSession: (sessionId: string) => Promise<void>;
  recordAttendance: (
    sessionId: string,
    studentId: string
  ) => HybridRecordAttendanceReturn;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];
  addSession: (data: Omit<PracticumSession, 'id' | 'status'>) => Promise<void>;
  updateSession: (
    sessionId: string,
    data: Partial<PracticumSession>
  ) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addParticipant: (participant: Participant) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
  addLaboratory: (data: Omit<Laboratory, 'id' | 'updatedAt'>) => Promise<void>;
  updateLaboratory: (
    laboratoryId: string,
    data: Partial<Omit<Laboratory, 'id'>>
  ) => Promise<void>;
  deleteLaboratory: (laboratoryId: string) => Promise<void>;
  laboratories: Laboratory[];
  laboratoriesLoading: boolean;

  // Extended helpers & backward-compatibility for Pertemuan 1 screens
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  assistants: AppUser[];
  students: AppUser[];
  classes: PracticumClass[];
  participants: Participant[];
  attendanceError: string | null;
  mergingClasses: boolean;
  classMergeError: string | null;
  mergeDuplicateClasses: () => Promise<ClassMergeSummary>;
  addClass: (data: Omit<PracticumClass, 'id'>) => Promise<void>;
  updateClass: (
    classId: string,
    data: Partial<PracticumClass>
  ) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  seedInitialData: () => Promise<void>;
};

export type PermissionContextValue = {
  myPermissions: PermissionRequest[];
  pendingPermissions: PermissionRequest[];
  allPermissions: PermissionRequest[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  submitPermission: (
    sessionId: string,
    reason: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    aiClassification?: AIClassification;
  }>;
  reviewPermission: (
    requestId: string,
    decision: 'approved' | 'rejected',
    note?: string
  ) => Promise<void>;
};
