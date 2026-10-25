import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PracticumSession } from '../../types/attendance';
import { StatusBadge } from './StatusBadge';

type SessionCardProps = {
  session: PracticumSession;
  attendanceCount: number;
  onPress: () => void;
};

export function formatIndonesianDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const dateObj = new Date(year, month, day);
  if (Number.isNaN(dateObj.getTime())) return isoDate;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return `${days[dateObj.getDay()]}, ${day} ${months[month]} ${year}`;
}

export function SessionCard({
  session,
  attendanceCount,
  onPress,
}: SessionCardProps) {
  const totalParticipants = session.participantIds?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.classBadge}>
          <Text style={styles.classBadgeText}>{session.className}</Text>
        </View>
        <StatusBadge status={session.status} size="sm" />
      </View>

      <Text style={styles.title}>{session.practicalName}</Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Jadwal</Text>
          <Text style={styles.metaValue}>
            {formatIndonesianDate(session.date)} • {session.startTime}–
            {session.endTime}
          </Text>
        </View>
        {session.room ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Ruangan</Text>
            <Text style={styles.metaValue}>{session.room}</Text>
          </View>
        ) : null}
        {session.assistantName ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Asisten</Text>
            <Text style={styles.metaValue}>{session.assistantName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.attendanceCountText}>
          {attendanceCount}
          {totalParticipants > 0 ? `/${totalParticipants}` : ''} hadir
        </Text>
        <Text style={styles.detailLink}>Detail →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: '#F8FAFC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 10,
  },
  metaContainer: {
    gap: 5,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  attendanceCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  detailLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
