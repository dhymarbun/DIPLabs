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
import { Ionicons } from '@expo/vector-icons';
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
    navigation.setOptions({ headerShown: false });
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
          } catch (error) {
            Alert.alert(
              'Logout gagal',
              error instanceof Error ? error.message : 'Coba lagi.'
            );
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

  const todaySession = baseSessions.find((session) => session.date === new Date().toISOString().slice(0, 10));
  const go = (path: '/praktikan' | '/praktikan/jadwal' | '/praktikan/riwayat' | '/maps' | '/praktikan/izin') => {
    if (path !== '/praktikan') router.push(path);
  };
  const feature = (title: string, description: string, color: string, icon: keyof typeof Ionicons.glyphMap, path: Parameters<typeof go>[0]) => (
    <Pressable onPress={() => go(path)} style={({ pressed }) => [styles.featureCard, { backgroundColor: color }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={28} color="#232420" />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.dashboardContent} showsVerticalScrollIndicator={false}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.greeting}>Selamat Pagi,{`\n`}{currentUser.name.split(' ')[0]}!</Text>
            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              style={({ pressed }) => [styles.logoutAction, (pressed || loggingOut) && styles.pressed]}
            >
              <Text style={styles.logoutActionText}>{loggingOut ? 'Keluar...' : 'Keluar'}</Text>
            </Pressable>
          </View>
          <Pressable style={({ pressed }) => [styles.todayBanner, pressed && styles.pressed]} onPress={() => todaySession && router.push(`/praktikan/${todaySession.id}`)}>
            <View style={styles.flexOne}><Text style={styles.todayTitle}>Praktikum Hari Ini</Text><Text style={styles.todaySummary}>{todaySession ? `${todaySession.practicalName} · ${todaySession.startTime} WIB` : 'Tidak ada jadwal hari ini'}</Text></View>
            <Ionicons name="calendar-outline" size={28} color="#232420" />
          </Pressable>
          <View style={styles.featureGrid}>
            {feature('Jadwal Praktikum', 'Lihat seluruh jadwal dan sesi mendatang.', '#FFE4A1', 'calendar-outline', '/praktikan/jadwal')}
            {feature('Peta Laboratorium', 'Temukan lokasi dan informasi laboratorium.', '#E3E7D8', 'map-outline', '/maps')}
            {feature('Pengajuan Izin', 'Ajukan izin ketidakhadiran praktikum.', '#F1D3CC', 'document-text-outline', '/praktikan/izin')}
            {feature('Riwayat Presensi', 'Pantau catatan kehadiran Anda.', '#E1D9FA', 'time-outline', '/praktikan/riwayat')}
          </View>
          {(sessionsLoading || attendanceError || filteredSessions.length > 0) && <View style={styles.scheduleHint}><Text style={styles.scheduleHintTitle}>{sessionsLoading ? 'Memuat jadwal...' : attendanceError ? 'Jadwal tidak dapat dimuat' : `${filteredSessions.length} sesi tersedia`}</Text>{attendanceError ? <Text style={styles.scheduleHintText}>{attendanceError}</Text> : null}</View>}
        </ScrollView>
        <View style={styles.bottomNav}>
          {([['Beranda', 'home-outline', '/praktikan'], ['Riwayat', 'time-outline', '/praktikan/riwayat'], ['Peta', 'map-outline', '/maps'], ['Izin', 'document-text-outline', '/praktikan/izin']] as const).map(([label, icon, path]) => <Pressable key={label} onPress={() => go(path)} style={({ pressed }) => [styles.navItem, path === '/praktikan' && styles.navActive, pressed && styles.pressed]}><Ionicons name={icon} size={22} color={path === '/praktikan' ? '#232420' : '#5E5F58'} /><Text style={[styles.navLabel, path === '/praktikan' && styles.navLabelActive]}>{label}</Text></Pressable>)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F1ED',
  },
  appShell: { flex: 1, backgroundColor: '#F2F1ED', borderRadius: 32, overflow: 'hidden' },
  dashboardContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 24 },
  dashboardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  flexOne: { flex: 1 },
  todayBanner: { minHeight: 112, padding: 16, borderRadius: 28, backgroundColor: '#FFC332', flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayTitle: { color: '#232420', fontSize: 18, lineHeight: 26, fontWeight: '500' },
  todaySummary: { color: '#232420', fontSize: 13, lineHeight: 19, marginTop: 8 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { width: '47.5%', minHeight: 204, padding: 16, borderRadius: 28, gap: 12 },
  featureTitle: { color: '#232420', fontSize: 17, lineHeight: 24, fontWeight: '500' },
  featureDescription: { color: '#232420', fontSize: 13, lineHeight: 19 },
  scheduleHint: { padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  scheduleHintTitle: { color: '#232420', fontWeight: '600', fontSize: 14 },
  scheduleHintText: { color: '#5E5F58', marginTop: 4, fontSize: 13 },
  bottomNav: { height: 84, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24, flexDirection: 'row', gap: 4, backgroundColor: '#F2F1ED' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 999, padding: 4 },
  navActive: { backgroundColor: '#FFE4A1' },
  navLabel: { color: '#5E5F58', fontSize: 11, lineHeight: 16 },
  navLabelActive: { color: '#232420', fontWeight: '600' },
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
    color: '#232420',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    fontWeight: '500',
    flex: 1,
  },
  logoutAction: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7D8D2', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  logoutActionText: { color: '#232420', fontSize: 12, fontWeight: '700' },
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
