import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAttendance } from '../../context/AttendanceContext';

export function formatCheckInTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function PraktikanHistoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { currentUser, sessions, getAttendanceForStudent } = useAttendance();

  useEffect(() => {
    navigation.setOptions({ title: 'Riwayat Presensi' });
  }, [navigation]);

  const isPraktikan = currentUser?.role === 'praktikan';

  const myRecords = useMemo(() => {
    if (!isPraktikan || !currentUser) return [];
    return [...getAttendanceForStudent(currentUser.id)].sort((a, b) =>
      b.checkedInAt.localeCompare(a.checkedInAt)
    );
  }, [isPraktikan, currentUser, getAttendanceForStudent]);

  if (!isPraktikan || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guard}>
          <Text style={styles.guardTitle}>Masuk sebagai praktikan</Text>
          <Text style={styles.guardSubtitle}>
            Pilih akun praktikan terlebih dahulu untuk melihat riwayat
            presensi.
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.guardBtn, pressed && styles.pressed]}
          >
            <Text style={styles.guardBtnText}>Pilih Akun</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Kehadiran</Text>
            <Text style={styles.summaryValue}>{myRecords.length}</Text>
            <Text style={styles.summarySub}>sesi tercatat</Text>
          </View>

          {myRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Belum ada riwayat presensi</Text>
              <Text style={styles.emptySubtitle}>
                Catatan kehadiran Anda akan muncul di sini setelah melakukan
                presensi pada sesi yang dibuka.
              </Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {myRecords.map((record) => {
                const session = sessions.find(
                  (s) => s.id === record.sessionId
                );
                return (
                  <View
                    key={`${record.sessionId}-${record.studentId}`}
                    style={styles.row}
                  >
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>
                        {session?.practicalName ?? record.sessionId}
                      </Text>
                      <Text style={styles.rowSub}>
                        {session?.className ?? '-'} •{' '}
                        {session
                          ? `${formatIndonesianDateShort(session.date)} • ${session.startTime}–${session.endTime}`
                          : 'Sesi tidak tersedia'}
                      </Text>
                    </View>
                    <Text style={styles.rowTime}>
                      {formatCheckInTime(record.checkedInAt)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MONTHS_SHORT = [
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

export function formatIndonesianDateShort(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const day = Number(parts[2]);
  const monthIndex = Number(parts[1]) - 1;
  const year = Number(parts[0]);
  if (Number.isNaN(day) || Number.isNaN(monthIndex) || Number.isNaN(year)) {
    return isoDate;
  }
  const month = MONTHS_SHORT[monthIndex] ?? parts[1];
  return `${day} ${month} ${year}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
  },
  rowTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  guard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  guardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  guardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  guardBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 6,
  },
  guardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
