import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  AttendanceRecord,
  AuthUser,
  Participant,
  PermissionRequest,
  PracticumClass,
  PracticumSession,
} from '../types/attendance';

function stripUndefined<T extends object>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export async function saveUserProfile(user: AuthUser): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    stripUndefined({
      name: user.name,
      email: user.email,
      role: user.role,
      nim: user.nim,
      className: user.className,
    })
  );
}

export async function fetchUserProfile(uid: string): Promise<AuthUser | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    role: data.role === 'asisten' ? 'asisten' : 'praktikan',
    nim: data.nim ? String(data.nim) : undefined,
    className: data.className ? String(data.className) : undefined,
  };
}

export async function createClassDoc(
  data: Omit<PracticumClass, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'classes'), stripUndefined(data));
  return ref.id;
}

export async function updateClassDoc(
  classId: string,
  data: Partial<PracticumClass>
): Promise<void> {
  const ref = doc(db, 'classes', classId);
  await updateDoc(ref, stripUndefined(data));
}

export async function deleteClassDoc(classId: string): Promise<void> {
  const ref = doc(db, 'classes', classId);
  await deleteDoc(ref);
}

export async function upsertParticipantDoc(
  participant: Participant
): Promise<void> {
  const docId = `${participant.classId}_${participant.studentId}`;
  const ref = doc(db, 'participants', docId);
  await setDoc(ref, stripUndefined(participant));
}

export async function removeParticipantDoc(
  participantId: string
): Promise<void> {
  const ref = doc(db, 'participants', participantId);
  await deleteDoc(ref);
}

export async function createSessionDoc(
  data: Omit<PracticumSession, 'id' | 'status'>
): Promise<string> {
  const payload = stripUndefined({
    ...data,
    status: 'upcoming',
  });
  const ref = await addDoc(collection(db, 'sessions'), payload);
  return ref.id;
}

export async function updateSessionDoc(
  sessionId: string,
  data: Partial<PracticumSession>
): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await updateDoc(ref, stripUndefined(data));
}

export async function deleteSessionDoc(sessionId: string): Promise<void> {
  const ref = doc(db, 'sessions', sessionId);
  await deleteDoc(ref);
}

export async function createAttendanceDoc(
  record: AttendanceRecord
): Promise<void> {
  const docId = `${record.sessionId}_${record.studentId}`;
  const ref = doc(db, 'attendance', docId);
  await setDoc(ref, stripUndefined(record));
}

export async function createPermissionDoc(
  data: Omit<PermissionRequest, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'permissionRequests'),
    stripUndefined(data as Record<string, unknown>)
  );
  return ref.id;
}

export async function updatePermissionReviewDoc(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string,
  note?: string
): Promise<void> {
  const ref = doc(db, 'permissionRequests', requestId);
  await updateDoc(
    ref,
    stripUndefined({
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      reviewerNote: note?.trim() ? note.trim() : undefined,
    })
  );
}
