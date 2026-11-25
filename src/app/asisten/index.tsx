import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SessionCard } from '../../components/asisten/SessionCard';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { usePermissions } from '../../context/PermissionContext';
import { SessionStatus } from '../../types/attendance';
import { colors } from '../../theme/tokens';

type FilterType = 'all' | SessionStatus;

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Dibuka' },
  { key: 'upcoming', label: 'Belum Dibuka' },
  { key: 'closed', label: 'Ditutup' },
];

export default function AsistenScheduleScreen() {
  const router = useRouter();
  const { authUser, authLoading, logout } = useAuth();
  const {
    sessions,
    sessionsLoading,
    attendanceError,
    getAttendanceForSession,
    seedInitialData,
  } = useAttendance();
  const { pendingPermissions } = usePermissions();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [seeding, setSeeding] = useState<boolean>(false);

  const filteredSessions = useMemo(() => {
    if (selectedFilter === 'all') return sessions;
    return sessions.filter((s) => s.status === selectedFilter);
  }, [sessions, selectedFilter]);

  const handleLogout = () => Alert.alert(
    'Keluar dari akun?',
    'Anda perlu masuk kembali untuk mengelola praktikum.',
    [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => {
        try {
          await logout();
          router.replace('/auth/login');
        } catch (error) {
          Alert.alert('Logout gagal', error instanceof Error ? error.message : 'Coba lagi.');
        }
      } },
    ]
  );

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedInitialData();
    } finally {
      setSeeding(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat data akun...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authUser || authUser.role !== 'asisten') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.guardTitle}>Akses Khusus Asisten</Text>
          <Text style={styles.guardSub}>
            Silakan masuk menggunakan akun asisten terlebih dahulu.
          </Text>
          <Pressable
            onPress={() => router.replace('/auth/login')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Ke Halaman Login</Text>
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
          <Text style={styles.pageTitle}>Dashboard Asisten</Text>
          {/* User Header */}
          <View style={styles.profileRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{authUser.name}</Text>
              <Text style={styles.profileSub}>
                Asisten • {authUser.nim ?? authUser.email}
                {authUser.className ? ` (${authUser.className})` : ''}
              </Text>
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.logoutBtnText}>Keluar</Text>
            </Pressable>
          </View>

          {/* Menu Navigasi Cepat: CRUD Praktikum & Pemeriksaan Izin */}
          <View style={styles.quickNavRow}>
            <Pressable
              onPress={() => router.push('/asisten/praktikum')}
              style={({ pressed }) => [
                styles.quickNavCard,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.quickNavTitle}>Kelola Praktikum</Text>
              <Text style={styles.quickNavSub}>
                Kelas, peserta, & jadwal sesi
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/asisten/izin')}
              style={({ pressed }) => [
                styles.quickNavCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.quickNavHeader}>
                <Text style={styles.quickNavTitle}>Daftar Izin</Text>
                {pendingPermissions.length > 0 ? (
                  <View style={styles.badgePending}>
                    <Text style={styles.badgePendingText}>
                      {pendingPermissions.length}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.quickNavSub}>
                Periksa alasan & klasifikasi AI
              </Text>
            </Pressable>
          </View>

          {attendanceError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{attendanceError}</Text>
            </View>
          ) : null}

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
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
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

          {/* Session List */}
          {sessionsLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={[styles.emptySubtitle, { marginTop: 8 }]}>
                Memuat jadwal sesi dari Firestore...
              </Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Belum ada jadwal sesi</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all'
                  ? 'Tambahkan sesi melalui menu Kelola Praktikum atau muat data contoh.'
                  : 'Tidak ada sesi untuk filter yang dipilih.'}
              </Text>
              {selectedFilter === 'all' && sessions.length === 0 ? (
                <Pressable
                  onPress={handleSeed}
                  disabled={seeding}
                  style={({ pressed }) => [
                    styles.seedBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.seedBtnText}>
                    {seeding ? 'Menyimpan...' : '+ Isi Contoh Jadwal Awal'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View>
              {filteredSessions.map((session) => {
                const records = getAttendanceForSession(session.id);
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    attendanceCount={records.length}
                    onPress={() => router.push(`/asisten/${session.id}`)}
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
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  loadingText: { fontSize: 13, color: colors.muted },
  guardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  guardSub: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  primaryBtn: { backgroundColor: colors.yellow, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginTop: 6 },
  primaryBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  profileRow: { backgroundColor: colors.card, borderRadius: 28, padding: 14, borderWidth: 1, borderColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 24, fontWeight: '600', color: colors.ink },
  profileSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  logoutBtn: { backgroundColor: colors.rose, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  logoutBtnText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  quickNavRow: { flexDirection: 'row', gap: 10 },
  quickNavCard: { flex: 1, backgroundColor: colors.yellowSoft, borderRadius: 28, padding: 14, borderWidth: 1, borderColor: colors.yellowSoft },
  quickNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickNavTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  quickNavSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  badgePending: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  badgePendingText: { color: colors.card, fontSize: 11, fontWeight: '700' },
  errorBanner: { backgroundColor: colors.rose, borderColor: colors.rose, borderWidth: 1, borderRadius: 20, padding: 12 },
  errorBannerText: { color: colors.ink, fontSize: 12 },
  pressed: { opacity: 0.85 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  filterChipTextActive: { color: colors.ink },
  emptyState: { backgroundColor: colors.card, borderRadius: 28, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.card },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  pageTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: '500' },
  seedBtn: { marginTop: 14, backgroundColor: colors.sage, borderColor: colors.sage, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  seedBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
});
