import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { PraktikanSessionCard } from '../../components/praktikan/PraktikanSessionCard';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

export default function PraktikanScheduleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    currentUser,
    sessions,
    sessionsLoading,
    attendanceError,
    getAttendanceForStudent,
  } = useAttendance();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Jadwal Praktikum' });
  }, [navigation]);

  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return getAttendanceForStudent(currentUser.id);
  }, [currentUser, getAttendanceForStudent]);

  const isPraktikan = currentUser?.role === 'praktikan';
  const handleLogout = () => Alert.alert(
    'Keluar dari akun?',
    'Anda perlu masuk kembali untuk melihat data presensi.',
    [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace('/auth/login');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]
  );

  const baseSessions = useMemo(() => {
    if (!isPraktikan || !currentUser) return [];
    return sessions.filter(
      (session) => session.participantIds?.includes(currentUser.id) ?? false
    );
  }, [isPraktikan, currentUser, sessions]);

  type FilterType = 'all' | 'upcoming' | 'open' | 'closed';
  const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'open', label: 'Dibuka' },
    { key: 'upcoming', label: 'Belum Dibuka' },
    { key: 'closed', label: 'Ditutup' },
  ];
  const [selectedFilter, setSelectedFilter] = React.useState<FilterType>('all');
  const filteredSessions = React.useMemo(() => {
    if (selectedFilter === 'all') return baseSessions;
    return baseSessions.filter((s) => s.status === selectedFilter);
  }, [baseSessions, selectedFilter]);

  if (!isPraktikan || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guard}>
          <Text style={styles.guardTitle}>Masuk sebagai praktikan</Text>
          <Text style={styles.guardSubtitle}>
            Pilih akun praktikan terlebih dahulu untuk melihat jadwal dan
            melakukan presensi.
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
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.greeting}>{currentUser.name}</Text>
              <Text style={styles.profileSub}>
                Praktikan • {currentUser.nim ?? '-'} (
                {currentUser.className ?? '-'})
              </Text>
            </View>
            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.logoutBtnText}>{loggingOut ? 'Keluar...' : 'Keluar'}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/praktikan/riwayat')}
            style={({ pressed }) => [
              styles.historyBtn,
              pressed && styles.pressed,
            ]}
          >
            <View>
              <Text style={styles.historyLabel}>Riwayat Presensi</Text>
              <Text style={styles.historySub}>
                {myRecords.length} sesi tercatat
              </Text>
            </View>
            <Text style={styles.historyLink}>Lihat →</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/praktikan/izin')}
            style={({ pressed }) => [styles.permissionBtn, pressed && styles.pressed]}
          >
            <View>
              <Text style={styles.permissionLabel}>Pengajuan Izin</Text>
              <Text style={styles.permissionSub}>Ajukan alasan ketidakhadiran dan pantau statusnya</Text>
            </View>
            <Text style={styles.historyLink}>Lihat →</Text>
          </Pressable>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_OPTIONS.map((item) => {
              const isActive = selectedFilter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedFilter(item.key)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {sessionsLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Memuat jadwal...</Text>
              <Text style={styles.emptySubtitle}>Mengambil sesi praktikum terbaru.</Text>
            </View>
          ) : attendanceError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Jadwal tidak dapat dimuat</Text>
              <Text style={styles.emptySubtitle}>{attendanceError}</Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {selectedFilter === 'all'
                  ? 'Belum ada jadwal'
                  : 'Tidak ada jadwal'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                  ? 'Anda belum terdaftar pada sesi praktikum mana pun.'
                  : `Belum ada sesi dengan status ${
                      FILTER_OPTIONS.find((f) => f.key === selectedFilter)?.label
                    }.`}
              </Text>
            </View>
          ) : (
            <View>
              {filteredSessions.map((session) => {
                const hasRecorded = myRecords.some(
                  (r) => r.sessionId === session.id
                );
                let footerNote = 'Sesi ditutup';
                if (session.status === 'open') {
                  footerNote = hasRecorded ? 'Sudah presensi' : 'Siap presensi';
                } else if (session.status === 'upcoming') {
                  footerNote = 'Belum dibuka';
                }

                return (
                  <PraktikanSessionCard
                    key={session.id}
                    session={session}
                    footerNote={footerNote}
                    onPress={() => router.push(`/praktikan/${session.id}`)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  profileRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  historyBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  historySub: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  historyLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  permissionBtn: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
  },
  permissionSub: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
    maxWidth: 260,
  },
  pressed: {
    opacity: 0.85,
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
