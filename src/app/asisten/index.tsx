import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SessionCard } from '../../components/asisten/SessionCard';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { usePermissions } from '../../context/PermissionContext';
import { SessionStatus } from '../../types/attendance';

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

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  guardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  guardSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    gap: 12,
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
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  quickNavSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  badgePending: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgePendingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.85,
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
  seedBtn: {
    marginTop: 14,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  seedBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
});
