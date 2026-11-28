import { PracticumSession } from '../types/attendance';

export type ScheduleStatus = 'before' | 'within' | 'after';

export function getSessionScheduleBounds(session: PracticumSession): {
  start: Date;
  end: Date;
} {
  const [year, month, day] = session.date.split('-').map(Number);
  const [startHour, startMin] = session.startTime.split(':').map(Number);
  const [endHour, endMin] = session.endTime.split(':').map(Number);

  const startDate = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    startHour || 0,
    startMin || 0,
    0,
    0
  );
  const endDate = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    endHour || 0,
    endMin || 0,
    0,
    0
  );
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  return { start: startDate, end: endDate };
}

export function getScheduleStatus(
  session: PracticumSession,
  now = new Date()
): ScheduleStatus {
  const { start, end } = getSessionScheduleBounds(session);
  if (now < start) return 'before';
  if (now > end) return 'after';
  return 'within';
}

export function isWithinSchedule(
  session: PracticumSession,
  now = new Date()
): boolean {
  return getScheduleStatus(session, now) === 'within';
}

export function canOpenSession(
  session: PracticumSession,
  now = new Date()
): boolean {
  return session.status === 'upcoming' && isWithinSchedule(session, now);
}

export function getScheduleMessage(
  session: PracticumSession,
  now = new Date()
): string | null {
  const status = getScheduleStatus(session, now);

  if (status === 'before') {
    return `Sesi belum dapat dibuka. Jadwal: ${session.date} pukul ${session.startTime}–${session.endTime} WIB.`;
  }

  if (status === 'after') {
    return `Jadwal sesi telah lewat (${session.date} pukul ${session.startTime}–${session.endTime} WIB).`;
  }

  return null;
}

export function hasSessionExpired(
  session: PracticumSession,
  now = new Date()
): boolean {
  const { end } = getSessionScheduleBounds(session);
  return now > end && session.status === 'open';
}
