import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { collection, getDoc, doc, onSnapshot } from 'firebase/firestore';
import {
  MOCK_ASSISTANTS,
  MOCK_ATTENDANCE_RECORDS,
  MOCK_SESSIONS,
  MOCK_STUDENTS,
} from '../data/mockData';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  createAttendanceDoc,
  createClassDoc,
  createSessionDoc,
  deleteClassDoc,
  deleteSessionDoc,
  removeParticipantDoc,
  updateClassDoc,
  updateSessionDoc,
  upsertParticipantDoc,
} from '../services/firestore';
import {
  AppUser,
  AttendanceContextValue,
  AttendanceRecord,
  HybridRecordAttendanceReturn,
  Participant,
  PracticumClass,
  PracticumSession,
  RecordAttendanceResult,
  SessionStatus,
} from '../types/attendance';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext<AttendanceContextValue | undefined>(
  undefined
);

function toHybridResult(
  syncResult: RecordAttendanceResult,
  asyncTask: Promise<RecordAttendanceResult>
): HybridRecordAttendanceReturn {
  return Object.assign(asyncTask, syncResult);
}

export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser } = useAuth();

  const [manualUser, setManualUser] = useState<AppUser | null>(null);
  const [assistants, setAssistants] = useState<AppUser[]>(MOCK_ASSISTANTS);
  const [students, setStudents] = useState<AppUser[]>(MOCK_STUDENTS);
  const [classes, setClasses] = useState<PracticumClass[]>([
    { id: 'cls-k01', name: 'K-01' },
    { id: 'cls-k02', name: 'K-02' },
  ]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allSessions, setAllSessions] =
    useState<PracticumSession[]>(MOCK_SESSIONS);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(
    isFirebaseConfigured
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >(isFirebaseConfigured ? [] : MOCK_ATTENDANCE_RECORDS);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const currentUser: AppUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.uid,
        name: authUser.name,
        role: authUser.role,
        nim: authUser.nim,
        className: authUser.className,
        email: authUser.email,
      };
    }
    return manualUser;
  }, [authUser, manualUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !authUser) {
      setSessionsLoading(false);
      return;
    }

    setSessionsLoading(true);
    setAttendanceError(null);

    const unsubSessions = onSnapshot(
      collection(db, 'sessions'),
      (snapshot) => {
        const list: PracticumSession[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const status: SessionStatus =
            d.status === 'open' || d.status === 'closed'
              ? d.status
              : 'upcoming';
          return {
            id: docSnap.id,
            classId: d.classId ? String(d.classId) : undefined,
            practicalName: String(d.practicalName ?? ''),
            className: String(d.className ?? ''),
            date: String(d.date ?? ''),
            startTime: String(d.startTime ?? ''),
            endTime: String(d.endTime ?? ''),
            room: d.room ? String(d.room) : undefined,
            assistantId: d.assistantId ? String(d.assistantId) : undefined,
            assistantName: d.assistantName ? String(d.assistantName) : undefined,
            status,
            participantIds: Array.isArray(d.participantIds)
              ? d.participantIds.map(String)
              : [],
          };
        });
        list.sort((a, b) =>
          `${a.date}_${a.startTime}`.localeCompare(`${b.date}_${b.startTime}`)
        );
        setAllSessions(list);
        setSessionsLoading(false);
      },
      (err) => {
        setAttendanceError(
          err.message || 'Gagal memuat jadwal sesi dari Firestore.'
        );
        setSessionsLoading(false);
      }
    );

    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        const list: AttendanceRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            sessionId: String(d.sessionId ?? ''),
            studentId: String(d.studentId ?? ''),
            studentName: String(d.studentName ?? ''),
            checkedInAt: String(d.checkedInAt ?? ''),
          };
        });
        setAttendanceRecords(list);
      },
      (err) => {
        setAttendanceError(
          err.message || 'Gagal memuat data presensi dari Firestore.'
        );
      }
    );

    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const list: PracticumClass[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: String(d.name ?? ''),
            assistantIds: Array.isArray(d.assistantIds)
              ? d.assistantIds.map(String)
              : undefined,
          };
        });
        setClasses(list);
      },
      () => {
        // Ignore error if collection is empty
      }
    );

    const unsubParticipants = onSnapshot(
      collection(db, 'participants'),
      (snapshot) => {
        const list: Participant[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            classId: String(d.classId ?? ''),
            studentId: String(d.studentId ?? ''),
            studentName: String(d.studentName ?? ''),
            nim: d.nim ? String(d.nim) : undefined,
          };
        });
        setParticipants(list);
      },
      () => {
        // Ignore error
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const nextAssistants: AppUser[] = [];
        const nextStudents: AppUser[] = [];
        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const userItem: AppUser = {
            id: docSnap.id,
            name: String(d.name ?? ''),
            role: d.role === 'asisten' ? 'asisten' : 'praktikan',
            nim: d.nim ? String(d.nim) : undefined,
            className: d.className ? String(d.className) : undefined,
            email: d.email ? String(d.email) : undefined,
          };
          if (userItem.role === 'asisten') {
            nextAssistants.push(userItem);
          } else {
            nextStudents.push(userItem);
          }
        });
        if (nextAssistants.length > 0 || nextStudents.length > 0) {
          setAssistants(nextAssistants);
          setStudents(nextStudents);
        }
      },
      () => {
        // Keep existing users list if query fails
      }
    );

    return () => {
      unsubSessions();
      unsubAttendance();
      unsubClasses();
      unsubParticipants();
      unsubUsers();
    };
  }, [authUser]);

  // Filter sessions based on role (asisten sees all; praktikan sees relevant sessions)
  const sessions = useMemo(() => {
    if (!authUser || authUser.role === 'asisten') {
      return allSessions;
    }

    const myClassIds = new Set(
      participants
        .filter((p) => p.studentId === authUser.uid)
        .map((p) => p.classId)
    );

    return allSessions.filter((s) => {
      if (s.participantIds && s.participantIds.includes(authUser.uid)) {
        return true;
      }
      if (s.classId && myClassIds.has(s.classId)) {
        return true;
      }
      if (
        authUser.className &&
        s.className.toLowerCase() === authUser.className.toLowerCase()
      ) {
        return true;
      }
      // If session has no restriction yet, allow praktikan to see it
      if (!s.participantIds || s.participantIds.length === 0) {
        return true;
      }
      return false;
    });
  }, [allSessions, authUser, participants]);

  const openSession = useCallback(async (sessionId: string) => {
    setAllSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'open' } : s))
    );
    if (isFirebaseConfigured && authUser) {
      await updateSessionDoc(sessionId, { status: 'open' });
    }
  }, [authUser]);

  const closeSession = useCallback(async (sessionId: string) => {
    setAllSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'closed' } : s))
    );
    if (isFirebaseConfigured && authUser) {
      await updateSessionDoc(sessionId, { status: 'closed' });
    }
  }, [authUser]);

  const recordAttendance = useCallback(
    (sessionId: string, studentId: string): HybridRecordAttendanceReturn => {
      const student =
        students.find((s) => s.id === studentId) ??
        (currentUser?.id === studentId && currentUser.role === 'praktikan'
          ? currentUser
          : undefined);

      if (!student) {
        const fail: RecordAttendanceResult = {
          ok: false,
          reason: 'user-not-found',
        };
        return toHybridResult(fail, Promise.resolve(fail));
      }

      const targetSession = allSessions.find((s) => s.id === sessionId);
      if (!targetSession || targetSession.status !== 'open') {
        const fail: RecordAttendanceResult = {
          ok: false,
          reason: 'session-not-open',
        };
        return toHybridResult(fail, Promise.resolve(fail));
      }

      const alreadyCheckedIn = attendanceRecords.some(
        (record) =>
          record.sessionId === sessionId && record.studentId === studentId
      );

      if (alreadyCheckedIn) {
        const fail: RecordAttendanceResult = {
          ok: false,
          reason: 'already-recorded',
        };
        return toHybridResult(fail, Promise.resolve(fail));
      }

      const newRecord: AttendanceRecord = {
        sessionId,
        studentId: student.id,
        studentName: student.name,
        checkedInAt: new Date().toISOString(),
      };

      const optimisticSuccess: RecordAttendanceResult = {
        ok: true,
        record: newRecord,
      };

      setAttendanceRecords((prev) => [...prev, newRecord]);

      const asyncTask = (async (): Promise<RecordAttendanceResult> => {
        if (!isFirebaseConfigured || !authUser) {
          return optimisticSuccess;
        }
        try {
          const docId = `${sessionId}_${student.id}`;
          const existingSnap = await getDoc(doc(db, 'attendance', docId));
          if (existingSnap.exists()) {
            return { ok: false, reason: 'already-recorded' };
          }
          await createAttendanceDoc(newRecord);
          return optimisticSuccess;
        } catch {
          return { ok: false, reason: 'session-not-open' };
        }
      })();

      return toHybridResult(optimisticSuccess, asyncTask);
    },
    [students, currentUser, allSessions, attendanceRecords, authUser]
  );

  const getAttendanceForSession = useCallback(
    (sessionId: string): AttendanceRecord[] => {
      return attendanceRecords.filter(
        (record) => record.sessionId === sessionId
      );
    },
    [attendanceRecords]
  );

  const getAttendanceForStudent = useCallback(
    (studentId: string): AttendanceRecord[] => {
      return attendanceRecords.filter(
        (record) => record.studentId === studentId
      );
    },
    [attendanceRecords]
  );

  const addSession = useCallback(
    async (data: Omit<PracticumSession, 'id' | 'status'>) => {
      if (isFirebaseConfigured && authUser) {
        await createSessionDoc(data);
      } else {
        const newSession: PracticumSession = {
          ...data,
          id: `ses-${Date.now()}`,
          status: 'upcoming',
        };
        setAllSessions((prev) => [...prev, newSession]);
      }
    },
    [authUser]
  );

  const updateSession = useCallback(
    async (sessionId: string, data: Partial<PracticumSession>) => {
      setAllSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
      );
      if (isFirebaseConfigured && authUser) {
        await updateSessionDoc(sessionId, data);
      }
    },
    [authUser]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      setAllSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (isFirebaseConfigured && authUser) {
        await deleteSessionDoc(sessionId);
      }
    },
    [authUser]
  );

  const addParticipant = useCallback(
    async (participant: Participant) => {
      setParticipants((prev) => {
        const filtered = prev.filter(
          (p) =>
            !(
              p.classId === participant.classId &&
              p.studentId === participant.studentId
            )
        );
        return [...filtered, participant];
      });
      if (isFirebaseConfigured && authUser) {
        await upsertParticipantDoc(participant);
      }
    },
    [authUser]
  );

  const removeParticipant = useCallback(
    async (participantId: string) => {
      setParticipants((prev) =>
        prev.filter((p) => `${p.classId}_${p.studentId}` !== participantId)
      );
      if (isFirebaseConfigured && authUser) {
        await removeParticipantDoc(participantId);
      }
    },
    [authUser]
  );

  const addClass = useCallback(
    async (data: Omit<PracticumClass, 'id'>) => {
      if (isFirebaseConfigured && authUser) {
        await createClassDoc(data);
      } else {
        setClasses((prev) => [
          ...prev,
          { ...data, id: `cls-${Date.now()}` },
        ]);
      }
    },
    [authUser]
  );

  const updateClass = useCallback(
    async (classId: string, data: Partial<PracticumClass>) => {
      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, ...data } : c))
      );
      if (isFirebaseConfigured && authUser) {
        await updateClassDoc(classId, data);
      }
    },
    [authUser]
  );

  const deleteClass = useCallback(
    async (classId: string) => {
      setClasses((prev) => prev.filter((c) => c.id !== classId));
      if (isFirebaseConfigured && authUser) {
        await deleteClassDoc(classId);
      }
    },
    [authUser]
  );

  const seedInitialData = useCallback(async () => {
    if (!isFirebaseConfigured || !authUser) return;
    await createClassDoc({ name: 'K-01', assistantIds: [authUser.uid] });
    await createClassDoc({ name: 'K-02', assistantIds: [authUser.uid] });
    for (const s of MOCK_SESSIONS) {
      await createSessionDoc({
        practicalName: s.practicalName,
        className: s.className,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        assistantId: authUser.uid,
        assistantName: authUser.name || s.assistantName,
        participantIds: [],
      });
    }
  }, [authUser]);

  const contextValue = useMemo<AttendanceContextValue>(
    () => ({
      sessions,
      sessionsLoading,
      attendanceRecords,
      openSession,
      closeSession,
      recordAttendance,
      getAttendanceForSession,
      getAttendanceForStudent,
      addSession,
      updateSession,
      deleteSession,
      addParticipant,
      removeParticipant,
      currentUser,
      setCurrentUser: setManualUser,
      assistants,
      students,
      classes,
      participants,
      attendanceError,
      addClass,
      updateClass,
      deleteClass,
      seedInitialData,
    }),
    [
      sessions,
      sessionsLoading,
      attendanceRecords,
      openSession,
      closeSession,
      recordAttendance,
      getAttendanceForSession,
      getAttendanceForStudent,
      addSession,
      updateSession,
      deleteSession,
      addParticipant,
      removeParticipant,
      currentUser,
      assistants,
      students,
      classes,
      participants,
      attendanceError,
      addClass,
      updateClass,
      deleteClass,
      seedInitialData,
    ]
  );

  return (
    <AttendanceContext.Provider value={contextValue}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance(): AttendanceContextValue {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
