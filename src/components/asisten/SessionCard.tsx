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
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
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
          <Text style={styles.classBadgeText}>Kelas {session.className}</Text>
        </View>
        <StatusBadge status={session.status} size="sm" />
      </View>

      <Text style={styles.title}>{session.practicalName}</Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Tanggal</Text>
          <Text style={styles.metaValue}>
            {formatIndonesianDate(session.date)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Waktu</Text>
          <Text style={styles.metaValue}>
            {session.startTime} – {session.endTime} WIB
          </Text>
        </View>
        {session.room ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Lokasi</Text>
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
        <View style={styles.attendancePill}>
          <Text style={styles.attendanceCountText}>
            {attendanceCount}
            {totalParticipants > 0 ? ` / ${totalParticipants}` : ''} Praktikan
            Hadir
          </Text>
        </View>
        <Text style={styles.detailLink}>Kelola Sesi →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: '#F8FAFC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaContainer: {
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
    minWidth: 64,
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
    marginTop: 12,
  },
  attendancePill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attendanceCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  detailLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
