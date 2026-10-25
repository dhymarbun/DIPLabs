import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MOCK_ASSISTANTS,
  MOCK_ATTENDANCE_RECORDS,
  MOCK_SESSIONS,
  MOCK_STUDENTS,
} from '../data/mockData';
import {
  AppUser,
  AttendanceContextValue,
  AttendanceRecord,
  PracticumSession,
  RecordAttendanceResult,
} from '../types/attendance';

const AttendanceContext = createContext<AttendanceContextValue | undefined>(
  undefined
);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [assistants] = useState<AppUser[]>(MOCK_ASSISTANTS);
  const [students] = useState<AppUser[]>(MOCK_STUDENTS);
  const [sessions, setSessions] = useState<PracticumSession[]>(MOCK_SESSIONS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    MOCK_ATTENDANCE_RECORDS
  );

  const openSession = useCallback((sessionId: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, status: 'open' } : session
      )
    );
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, status: 'closed' } : session
      )
    );
  }, []);

  const recordAttendance = useCallback(
    (sessionId: string, studentId: string): RecordAttendanceResult => {
      const student =
        students.find((s) => s.id === studentId) ??
        (currentUser?.id === studentId && currentUser.role === 'praktikan'
          ? currentUser
          : undefined);

      if (!student) {
        return { ok: false, reason: 'user-not-found' };
      }

      const targetSession = sessions.find((s) => s.id === sessionId);
      if (!targetSession || targetSession.status !== 'open') {
        return { ok: false, reason: 'session-not-open' };
      }

      const alreadyCheckedIn = attendanceRecords.some(
        (record) =>
          record.sessionId === sessionId && record.studentId === studentId
      );

      if (alreadyCheckedIn) {
        return { ok: false, reason: 'already-recorded' };
      }

      const newRecord: AttendanceRecord = {
        sessionId,
        studentId: student.id,
        studentName: student.name,
        checkedInAt: new Date().toISOString(),
      };

      setAttendanceRecords((prevRecords) => [...prevRecords, newRecord]);

      return { ok: true, record: newRecord };
    },
    [students, currentUser, sessions, attendanceRecords]
  );

  const getAttendanceForSession = useCallback(
    (sessionId: string): AttendanceRecord[] => {
      return attendanceRecords.filter((record) => record.sessionId === sessionId);
    },
    [attendanceRecords]
  );

  const getAttendanceForStudent = useCallback(
    (studentId: string): AttendanceRecord[] => {
      return attendanceRecords.filter((record) => record.studentId === studentId);
    },
    [attendanceRecords]
  );

  const contextValue = useMemo<AttendanceContextValue>(
    () => ({
      currentUser,
      setCurrentUser,
      assistants,
      students,
      sessions,
      attendanceRecords,
      openSession,
      closeSession,
      recordAttendance,
      getAttendanceForSession,
      getAttendanceForStudent,
    }),
    [
      currentUser,
      assistants,
      students,
      sessions,
      attendanceRecords,
      openSession,
      closeSession,
      recordAttendance,
      getAttendanceForSession,
      getAttendanceForStudent,
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
