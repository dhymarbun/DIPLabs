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
    navigation.setOptions({ title: 'Riwayat Presensi', headerShown: false });
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
        <View style={styles.container}><Pressable onPress={() => router.back()}><Text style={styles.backText}>‹  Kembali</Text></Pressable><Text style={styles.pageTitle}>Riwayat Presensi</Text>
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
    backgroundColor: '#F2F1ED',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#E1D9FA',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#5E5F58',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#232420',
    marginTop: 2,
  },
  summarySub: {
    fontSize: 12,
    color: '#5E5F58',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232420',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5E5F58',
    textAlign: 'center',
    lineHeight: 19,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F2F1ED',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232420',
  },
  rowSub: {
    fontSize: 12,
    color: '#5E5F58',
  },
  rowTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3E5B28',
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
  pressed: {
    opacity: 0.85,
  },
  pageTitle: { color: '#232420', fontSize: 32, lineHeight: 38, fontWeight: '500' },
  backText: { color: '#5E5F58', fontWeight: '600', paddingVertical: 8 },
});
