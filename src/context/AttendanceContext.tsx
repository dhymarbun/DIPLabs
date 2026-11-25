import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { collection, getDoc, doc, onSnapshot, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  createLaboratoryDoc,
  updateLaboratoryDoc,
  deleteLaboratoryDoc,
} from '../services/firestore';
import {
  AppUser,
  AttendanceContextValue,
  AttendanceRecord,
  ClassMergeSummary,
  HybridRecordAttendanceReturn,
  Participant,
  PracticumClass,
  PracticumSession,
  RecordAttendanceResult,
  SessionStatus,
} from '../types/attendance';
import { Laboratory } from '../types/notification';
import {
  sendPushNotificationToUsers,
  createNotificationPayload,
} from '../services/notifications';
import { groupClassesByName, normalizeClassName } from '../utils/classNames';
import { getScheduleStatus, hasSessionExpired } from '../utils/sessionSchedule';
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
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [laboratoriesLoading, setLaboratoriesLoading] = useState<boolean>(
    isFirebaseConfigured
  );
  const [allSessions, setAllSessions] =
    useState<PracticumSession[]>(MOCK_SESSIONS);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(
    isFirebaseConfigured
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >(isFirebaseConfigured ? [] : MOCK_ATTENDANCE_RECORDS);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [classesReady, setClassesReady] = useState<boolean>(
    !isFirebaseConfigured
  );
  const [participantsReady, setParticipantsReady] = useState<boolean>(
    !isFirebaseConfigured
  );
  const [mergingClasses, setMergingClasses] = useState<boolean>(false);
  const [classMergeError, setClassMergeError] = useState<string | null>(null);
  const mergeInProgressRef = useRef<boolean>(false);
  const lastMergeSignatureRef = useRef<string | null>(null);
  const classesReadyUidRef = useRef<string | null>(null);
  const participantsReadyUidRef = useRef<string | null>(null);

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
    lastMergeSignatureRef.current = null;
    setClassMergeError(null);
    if (!isFirebaseConfigured || !authUser) {
      if (isFirebaseConfigured) {
        // Listener callbacks can arrive just after sign-out. Clear account data
        // before another user can enter the app.
        setAllSessions([]);
        setAttendanceRecords([]);
        setClasses([]);
        setParticipants([]);
        setLaboratories([]);
        setStudents([]);
      }
      setSessionsLoading(false);
      setLaboratoriesLoading(false);
      setAttendanceError(null);
      setClassesReady(true);
      setParticipantsReady(true);
      classesReadyUidRef.current = authUser?.uid ?? null;
      participantsReadyUidRef.current = authUser?.uid ?? null;
      return;
    }

    setSessionsLoading(true);
    setLaboratoriesLoading(authUser.role === 'asisten');
    setAttendanceError(null);
    // Do not display the previous user's data while the new listeners connect.
    setAllSessions([]);
    setAttendanceRecords([]);
    setClasses([]);
    setParticipants([]);
    setLaboratories([]);
    setStudents([]);
    setClassesReady(false);
    setParticipantsReady(false);
    classesReadyUidRef.current = null;
    participantsReadyUidRef.current = null;

    const sessionQuery = authUser.role === 'asisten'
      ? query(collection(db, 'sessions'), where('assistantId', '==', authUser.uid))
      : query(collection(db, 'sessions'), where('participantIds', 'array-contains', authUser.uid));
    const unsubSessions = onSnapshot(
      sessionQuery,
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
            labId: d.labId ? String(d.labId) : undefined,
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

    const attendanceQuery = authUser.role === 'asisten'
      ? query(collection(db, 'attendance'), where('assistantId', '==', authUser.uid))
      : query(collection(db, 'attendance'), where('studentId', '==', authUser.uid));
    const unsubAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const list: AttendanceRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            sessionId: String(d.sessionId ?? ''),
            studentId: String(d.studentId ?? ''),
            studentName: String(d.studentName ?? ''),
            checkedInAt: String(d.checkedInAt ?? ''),
            assistantId: d.assistantId ? String(d.assistantId) : undefined,
            nim: d.nim ? String(d.nim) : undefined,
            className: d.className ? String(d.className) : undefined,
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

    const unsubClasses = authUser.role === 'asisten'
      ? onSnapshot(collection(db, 'classes'), (snapshot) => {
          setClasses(snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return { id: docSnap.id, name: String(d.name ?? ''), assistantIds: Array.isArray(d.assistantIds) ? d.assistantIds.map(String) : undefined };
          }));
          classesReadyUidRef.current = authUser.uid;
          setClassesReady(true);
        }, () => undefined)
      : () => undefined;

    const unsubParticipants = authUser.role === 'asisten'
      ? onSnapshot(collection(db, 'participants'), (snapshot) => {
          setParticipants(snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return { classId: String(d.classId ?? ''), studentId: String(d.studentId ?? ''), studentName: String(d.studentName ?? ''), nim: d.nim ? String(d.nim) : undefined };
          }));
          participantsReadyUidRef.current = authUser.uid;
          setParticipantsReady(true);
        }, () => undefined)
      : () => undefined;

    const unsubLaboratories = authUser.role === 'asisten'
      ? onSnapshot(collection(db, 'laboratories'), (snapshot) => {
          setLaboratories(snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              name: String(d.name ?? ''),
              room: String(d.room ?? ''),
              description: d.description ? String(d.description) : undefined,
              latitude: typeof d.latitude === 'number' ? d.latitude : Number(d.latitude ?? 0),
              longitude: typeof d.longitude === 'number' ? d.longitude : Number(d.longitude ?? 0),
              radiusMeters:
                typeof d.radiusMeters === 'number' ? d.radiusMeters : Number(d.radiusMeters ?? 0),
              updatedAt: String(d.updatedAt ?? ''),
            };
          }));
          setLaboratoriesLoading(false);
        }, (err) => {
          setAttendanceError(
            err.message || 'Gagal memuat data laboratorium dari Firestore.'
          );
          setLaboratoriesLoading(false);
        })
      : () => undefined;

    const unsubUsers = authUser.role === 'asisten'
      ? onSnapshot(query(collection(db, 'users'), where('role', '==', 'praktikan')), (snapshot) => {
          setStudents(snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return { id: docSnap.id, name: String(d.name ?? ''), role: 'praktikan', nim: d.nim ? String(d.nim) : undefined, className: d.className ? String(d.className) : undefined, email: d.email ? String(d.email) : undefined };
          }));
        }, () => undefined)
      : () => undefined;

    return () => {
      unsubSessions();
      unsubAttendance();
      unsubClasses();
      unsubParticipants();
      unsubUsers();
      unsubLaboratories();
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
    const targetSession = allSessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      throw new Error('Sesi tidak ditemukan.');
    }
    if (targetSession.status !== 'upcoming') {
      throw new Error('Sesi sudah dibuka atau ditutup.');
    }

    const scheduleStatus = getScheduleStatus(targetSession);
    if (scheduleStatus === 'before') {
      throw new Error(
        `Sesi belum dapat dibuka. Jadwal: ${targetSession.date} pukul ${targetSession.startTime}–${targetSession.endTime} WIB.`
      );
    }
    if (scheduleStatus === 'after') {
      throw new Error(
        `Jadwal sesi telah lewat (${targetSession.date} pukul ${targetSession.startTime}–${targetSession.endTime} WIB).`
      );
    }

    setAllSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'open' } : s))
    );
    if (isFirebaseConfigured && authUser) {
      await updateSessionDoc(sessionId, { status: 'open' });
    }

    const participantIds = targetSession.participantIds ?? [];
    if (participantIds.length > 0) {
      sendPushNotificationToUsers(
        participantIds,
        createNotificationPayload('session_opened', {
          sessionId,
          sessionName: targetSession.practicalName,
          className: targetSession.className,
        })
      );
    }
  }, [allSessions, authUser]);

  const closeSession = useCallback(async (sessionId: string) => {
     setAllSessions((prev) =>
       prev.map((s) => (s.id === sessionId ? { ...s, status: 'closed' } : s))
     );
     if (isFirebaseConfigured && authUser) {
       await updateSessionDoc(sessionId, { status: 'closed' });
     }
   }, [authUser]);

  // Auto-close interval effect for sessions that are open and past their end time
  useEffect(() => {
    if (!authUser) return;

    // Only asisten can auto-close sessions
    if (authUser.role !== 'asisten') return;
    
    // Only run if we have sessions and are not in the middle of a merge operation
    if (mergingClasses || sessionsLoading) return;
    
    // Check every 60 seconds
    const intervalId = setInterval(() => {
      const now = new Date();
      
      // Find all sessions that are open and expired
      const expiredSessions = allSessions.filter(session => 
        session.status === 'open' && hasSessionExpired(session, now)
      );
      
      // Close each expired session
      expiredSessions.forEach(({ id: sessionId }) => {
        // Close the session
        void closeSession(sessionId).catch(err => {
          console.error('Auto-close failed:', err);
        });
      });
    }, 60000); // Check every 60 seconds
    
    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [allSessions, authUser, closeSession, mergingClasses, sessionsLoading]);

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
        assistantId: targetSession.assistantId,
        nim: student.nim,
        className: student.className,
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
      const scheduleFields = ['date', 'startTime', 'endTime', 'room', 'labId'];
      const changedFields = Object.keys(data).filter((k) =>
        scheduleFields.includes(k)
      );
      setAllSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...data } : s))
      );
      if (isFirebaseConfigured && authUser) {
        await updateSessionDoc(sessionId, data);
      }

      if (changedFields.length > 0) {
        const session = allSessions.find((s) => s.id === sessionId);
        const participantIds = session?.participantIds ?? [];
        if (participantIds.length > 0) {
          sendPushNotificationToUsers(
            participantIds,
            createNotificationPayload('schedule_updated', {
              sessionId,
              sessionName: session?.practicalName,
              className: session?.className,
              changes: changedFields,
            })
          );
        }
      }
    },
    [allSessions, authUser]
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

  const addLaboratory = useCallback(
    async (data: Omit<Laboratory, 'id' | 'updatedAt'>) => {
      if (isFirebaseConfigured && authUser) {
        const labId = await createLaboratoryDoc(data);
        const newLab: Laboratory = {
          ...data,
          id: labId,
          updatedAt: new Date().toISOString(),
        };
        setLaboratories((prev) => [...prev, newLab]);
      } else {
        const newLab: Laboratory = {
          ...data,
          id: `lab-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
        setLaboratories((prev) => [...prev, newLab]);
      }
    },
    [authUser]
  );

  const updateLaboratory = useCallback(
    async (laboratoryId: string, data: Partial<Omit<Laboratory, 'id'>>) => {
      setLaboratories((prev) =>
        prev.map((l) => (l.id === laboratoryId ? { ...l, ...data, updatedAt: new Date().toISOString() } : l))
      );
      if (isFirebaseConfigured && authUser) {
        await updateLaboratoryDoc(laboratoryId, data);
      }
    },
    [authUser]
  );

  const deleteLaboratory = useCallback(
    async (laboratoryId: string) => {
      setLaboratories((prev) => prev.filter((l) => l.id !== laboratoryId));
      if (isFirebaseConfigured && authUser) {
        await deleteLaboratoryDoc(laboratoryId);
      }
    },
    [authUser]
  );

  const syncSessionParticipants = useCallback(
    async (classKey: string, studentId: string, action: 'add' | 'remove') => {
      const classNames = new Set<string>([classKey]);
      const classDoc = classes.find(
        (c) => c.id === classKey || c.name === classKey
      );
      if (classDoc) {
        classNames.add(classDoc.id);
        classNames.add(classDoc.name);
      }
      const belongsToClass = (session: PracticumSession) =>
        classNames.has(session.className) ||
        (!!session.classId && classNames.has(session.classId));
      const applyAction = (ids: string[] | undefined) => {
        const current = ids ?? [];
        if (action === 'add') {
          return current.includes(studentId)
            ? current
            : [...current, studentId];
        }
        return current.filter((id) => id !== studentId);
      };

      setAllSessions((prev) =>
        prev.map((session) =>
          belongsToClass(session)
            ? { ...session, participantIds: applyAction(session.participantIds) }
            : session
        )
      );

      if (isFirebaseConfigured && authUser) {
        const affectedSessions = allSessions.filter(belongsToClass);
        await Promise.all(
          affectedSessions.map((session) =>
            updateSessionDoc(session.id, {
              participantIds: applyAction(session.participantIds),
            })
          )
        );
      }
    },
    [allSessions, authUser, classes]
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
      await syncSessionParticipants(
        participant.classId,
        participant.studentId,
        'add'
      );
    },
    [authUser, syncSessionParticipants]
  );

  const removeParticipant = useCallback(
    async (participantId: string) => {
      const target = participants.find(
        (p) => `${p.classId}_${p.studentId}` === participantId
      );
      setParticipants((prev) =>
        prev.filter((p) => `${p.classId}_${p.studentId}` !== participantId)
      );
      if (isFirebaseConfigured && authUser) {
        await removeParticipantDoc(participantId);
      }
      if (target) {
        await syncSessionParticipants(
          target.classId,
          target.studentId,
          'remove'
        );
      }
    },
    [authUser, participants, syncSessionParticipants]
  );

  const addClass = useCallback(
    async (data: Omit<PracticumClass, 'id'>) => {
      const normalizedName = normalizeClassName(data.name);
      if (!normalizedName) {
        throw new Error('Nama kelas wajib diisi.');
      }
      if (
        classes.some(
          (c) => normalizeClassName(c.name) === normalizedName
        )
      ) {
        throw new Error('Nama kelas sudah ada.');
      }
      if (isFirebaseConfigured && authUser) {
        const classId = await createClassDoc(data);
        setClasses((prev) =>
          prev.some((c) => c.id === classId)
            ? prev
            : [...prev, { ...data, id: classId }]
        );
      } else {
        setClasses((prev) => [
          ...prev,
          { ...data, id: `cls-${Date.now()}` },
        ]);
      }
    },
    [authUser, classes]
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

  const mergeDuplicateClasses = useCallback(async (): Promise<ClassMergeSummary> => {
    const summary: ClassMergeSummary = {
      mergedGroups: 0,
      removedClasses: 0,
      movedParticipants: 0,
      updatedSessions: 0,
    };

    const duplicateGroups = groupClassesByName(classes).filter(
      (group) => group.classes.length > 1
    );
    if (duplicateGroups.length === 0) {
      setClassMergeError(null);
      return summary;
    }
    if (mergeInProgressRef.current) {
      return summary;
    }

    mergeInProgressRef.current = true;
    setMergingClasses(true);
    setClassMergeError(null);

    try {
      for (const group of duplicateGroups) {
        const groupIds = new Set(group.classes.map((c) => c.id));
        const groupKeys = new Set(
          group.classes.map((c) => normalizeClassName(c.name))
        );

        const groupParticipants = participants.filter(
          (p) =>
            groupIds.has(p.classId) ||
            groupKeys.has(normalizeClassName(p.classId))
        );
        const groupSessions = allSessions.filter(
          (s) =>
            (!!s.classId && groupIds.has(s.classId)) ||
            groupKeys.has(normalizeClassName(s.className))
        );

        const scoreClass = (classDoc: PracticumClass) => ({
          participants: groupParticipants.filter(
            (p) =>
              p.classId === classDoc.id ||
              p.classId.trim() === classDoc.name.trim()
          ).length,
          sessions: groupSessions.filter(
            (s) =>
              s.classId === classDoc.id ||
              s.className.trim() === classDoc.name.trim()
          ).length,
        });

        const canonical = [...group.classes].sort((a, b) => {
          const scoreA = scoreClass(a);
          const scoreB = scoreClass(b);
          if (scoreA.participants !== scoreB.participants) {
            return scoreB.participants - scoreA.participants;
          }
          if (scoreA.sessions !== scoreB.sessions) {
            return scoreB.sessions - scoreA.sessions;
          }
          return a.id.localeCompare(b.id);
        })[0];

        const canonicalName = canonical.name.trim();
        const duplicates = group.classes.filter(
          (c) => c.id !== canonical.id
        );
        const assistantIds = Array.from(
          new Set(
            group.classes.flatMap((c) => c.assistantIds ?? [])
          )
        );

        const participantsByStudent = new Map<string, Participant>();
        for (const participant of groupParticipants) {
          const existing = participantsByStudent.get(
            participant.studentId
          );
          if (!existing) {
            participantsByStudent.set(
              participant.studentId,
              participant
            );
            continue;
          }
          const existingIsCanonical =
            existing.classId === canonicalName ||
            existing.classId === canonical.id;
          const nextIsCanonical =
            participant.classId === canonicalName ||
            participant.classId === canonical.id;
          if (
            (!existingIsCanonical && nextIsCanonical) ||
            (!existing.nim && participant.nim)
          ) {
            participantsByStudent.set(
              participant.studentId,
              participant
            );
          }
        }

        const mergedParticipants = Array.from(
          participantsByStudent.values()
        );
        const mergedStudentIds = mergedParticipants.map(
          (p) => p.studentId
        );

        const canonicalAssistantIds = canonical.assistantIds ?? [];
        const assistantsChanged =
          assistantIds.length !== canonicalAssistantIds.length ||
          assistantIds.some(
            (id) => !canonicalAssistantIds.includes(id)
          );
        if (isFirebaseConfigured && authUser) {
          if (
            canonical.name !== canonicalName ||
            assistantsChanged
          ) {
            await updateClassDoc(canonical.id, {
              name: canonicalName,
              assistantIds,
            });
          }
        }

        for (const participant of mergedParticipants) {
          const targetClassId = canonicalName;
          const targetDocId = `${targetClassId}_${participant.studentId}`;
          if (participant.classId !== targetClassId) {
            if (isFirebaseConfigured && authUser) {
              await upsertParticipantDoc({
                ...participant,
                classId: targetClassId,
              });
            }
            summary.movedParticipants += 1;
          }
          const staleDocs = groupParticipants.filter(
            (candidate) =>
              candidate.studentId === participant.studentId &&
              `${candidate.classId}_${candidate.studentId}` !==
                targetDocId
          );
          for (const staleDoc of staleDocs) {
            if (isFirebaseConfigured && authUser) {
              await removeParticipantDoc(
                `${staleDoc.classId}_${staleDoc.studentId}`
              );
            }
          }
        }

        for (const session of groupSessions) {
          const participantIdsChanged =
            JSON.stringify(session.participantIds ?? []) !==
            JSON.stringify(mergedStudentIds);
          if (
            session.className !== canonicalName ||
            session.classId !== canonical.id ||
            participantIdsChanged
          ) {
            if (isFirebaseConfigured && authUser) {
              await updateSessionDoc(session.id, {
                className: canonicalName,
                classId: canonical.id,
                participantIds: mergedStudentIds,
              });
            }
            summary.updatedSessions += 1;
          }
        }

        for (const duplicate of duplicates) {
          if (isFirebaseConfigured && authUser) {
            await deleteClassDoc(duplicate.id);
          }
          summary.removedClasses += 1;
        }

        setClasses((prev) => {
          const duplicateIds = new Set(
            duplicates.map((c) => c.id)
          );
          return prev
            .filter((c) => !duplicateIds.has(c.id))
            .map((c) =>
              c.id === canonical.id
                ? { ...c, name: canonicalName, assistantIds }
                : c
            );
        });
        setParticipants((prev) => {
          const remaining = prev.filter(
            (p) =>
              !groupIds.has(p.classId) &&
              !groupKeys.has(normalizeClassName(p.classId))
          );
          return [
            ...remaining,
            ...mergedParticipants.map((p) => ({
              ...p,
              classId: canonicalName,
            })),
          ];
        });
        const groupSessionIds = new Set(
          groupSessions.map((s) => s.id)
        );
        setAllSessions((prev) =>
          prev.map((s) =>
            groupSessionIds.has(s.id)
              ? {
                  ...s,
                  className: canonicalName,
                  classId: canonical.id,
                  participantIds: mergedStudentIds,
                }
              : s
          )
        );

        summary.mergedGroups += 1;
      }

      setClassMergeError(null);
      return summary;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal menggabungkan kelas duplikat.';
      setClassMergeError(message);
      throw err;
    } finally {
      mergeInProgressRef.current = false;
      setMergingClasses(false);
    }
  }, [allSessions, authUser, classes, participants]);

  useEffect(() => {
    if (!authUser || authUser.role !== 'asisten') return;
    if (
      !classesReady ||
      !participantsReady ||
      classesReadyUidRef.current !== authUser.uid ||
      participantsReadyUidRef.current !== authUser.uid ||
      sessionsLoading
    ) {
      return;
    }
    if (mergeInProgressRef.current) return;

    const duplicateGroups = groupClassesByName(classes).filter(
      (group) => group.classes.length > 1
    );
    if (duplicateGroups.length === 0) {
      lastMergeSignatureRef.current = null;
      return;
    }

    const signature = duplicateGroups
      .map((group) =>
        group.classes
          .map((c) => c.id)
          .sort()
          .join(',')
      )
      .sort()
      .join('|');
    if (lastMergeSignatureRef.current === signature) return;

    lastMergeSignatureRef.current = signature;
    void mergeDuplicateClasses().catch(() => undefined);
  }, [
    authUser,
    classes,
    classesReady,
    mergeDuplicateClasses,
    participantsReady,
    sessionsLoading,
  ]);

  const seedInitialData = useCallback(async () => {
    if (!isFirebaseConfigured || !authUser) return;
    const ensureClass = async (name: string) => {
      const normalizedName = normalizeClassName(name);
      if (
        classes.some(
          (c) => normalizeClassName(c.name) === normalizedName
        )
      ) {
        return;
      }
      await createClassDoc({
        name,
        assistantIds: [authUser.uid],
      });
    };
    await ensureClass('K-01');
    await ensureClass('K-02');
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
  }, [authUser, classes]);

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
      addLaboratory,
      updateLaboratory,
      deleteLaboratory,
      laboratories,
      laboratoriesLoading,
      currentUser,
      setCurrentUser: setManualUser,
      assistants,
      students,
      classes,
      participants,
      attendanceError,
      mergingClasses,
      classMergeError,
      mergeDuplicateClasses,
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
      addLaboratory,
      updateLaboratory,
      deleteLaboratory,
      laboratories,
      laboratoriesLoading,
      currentUser,
      assistants,
      students,
      classes,
      participants,
      attendanceError,
      mergingClasses,
      classMergeError,
      mergeDuplicateClasses,
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
