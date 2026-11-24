import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where,
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
import {
  Laboratory,
  NotificationPayload,
} from '../types/notification';

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
  const profile = stripUndefined({
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    nim: user.nim,
    className: user.className,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await runTransaction(db, async (transaction) => {
    const nimRef = doc(db, 'nims', user.nim ?? '');
    const existing = await transaction.get(nimRef);
    if (existing.exists() && existing.data().uid !== user.uid) {
      throw new Error('NIM sudah terdaftar. Gunakan NIM lain.');
    }
    transaction.set(nimRef, { uid: user.uid });
    transaction.set(ref, profile);
  });
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

const LABORATORIES_COLLECTION = 'laboratories';

export async function createLaboratoryDoc(
  data: Omit<Laboratory, 'id' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, LABORATORIES_COLLECTION),
    stripUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    })
  );
  return ref.id;
}

export async function updateLaboratoryDoc(
  laboratoryId: string,
  data: Partial<Omit<Laboratory, 'id'>>
): Promise<void> {
  const ref = doc(db, LABORATORIES_COLLECTION, laboratoryId);
  await updateDoc(
    ref,
    stripUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function deleteLaboratoryDoc(laboratoryId: string): Promise<void> {
  const ref = doc(db, LABORATORIES_COLLECTION, laboratoryId);
  await deleteDoc(ref);
}

export async function fetchLaboratories(): Promise<Laboratory[]> {
  const snapshot = await getDocs(collection(db, LABORATORIES_COLLECTION));
  return snapshot.docs.map((docSnap) => {
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
  });
}

export async function fetchLaboratoryById(
  laboratoryId: string
): Promise<Laboratory | null> {
  const ref = doc(db, LABORATORIES_COLLECTION, laboratoryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    name: String(d.name ?? ''),
    room: String(d.room ?? ''),
    description: d.description ? String(d.description) : undefined,
    latitude: typeof d.latitude === 'number' ? d.latitude : Number(d.latitude ?? 0),
    longitude: typeof d.longitude === 'number' ? d.longitude : Number(d.longitude ?? 0),
    radiusMeters:
      typeof d.radiusMeters === 'number' ? d.radiusMeters : Number(d.radiusMeters ?? 0),
    updatedAt: String(d.updatedAt ?? ''),
  };
}

export async function createNotificationLogDoc(data: {
  recipientIds: string[];
  title: string;
  body: string;
  payload: NotificationPayload;
  sentVia: 'expo' | 'fcm' | 'local';
  status: 'sent' | 'failed' | 'delivered';
}): Promise<string> {
  const ref = await addDoc(
    collection(db, 'notifications'),
    stripUndefined({
      ...data,
      createdAt: new Date().toISOString(),
    })
  );
  return ref.id;
}
