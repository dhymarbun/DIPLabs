import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SessionCard } from '../../components/asisten/SessionCard';
import { useAttendance } from '../../context/AttendanceContext';
import { SessionStatus } from '../../types/attendance';

type FilterType = 'all' | SessionStatus;

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Sedang Dibuka' },
  { key: 'upcoming', label: 'Belum Dibuka' },
  { key: 'closed', label: 'Sudah Ditutup' },
];

export default function AsistenScheduleScreen() {
  const router = useRouter();
  const {
    currentUser,
    assistants,
    setCurrentUser,
    sessions,
    getAttendanceForSession,
  } = useAttendance();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const activeAssistant =
    currentUser?.role === 'asisten' ? currentUser : assistants[0] ?? null;

  const stats = useMemo(() => {
    const open = sessions.filter((s) => s.status === 'open').length;
    const upcoming = sessions.filter((s) => s.status === 'upcoming').length;
    const closed = sessions.filter((s) => s.status === 'closed').length;
    return { total: sessions.length, open, upcoming, closed };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (selectedFilter === 'all') return sessions;
    return sessions.filter((s) => s.status === selectedFilter);
  }, [sessions, selectedFilter]);

  const handleEnsureAssistantAndOpenSession = (sessionId: string) => {
    if ((!currentUser || currentUser.role !== 'asisten') && activeAssistant) {
      setCurrentUser(activeAssistant);
    }
    router.push(`/asisten/${sessionId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Identity Banner */}
          <View style={styles.identityBanner}>
            <View style={styles.identityTextGroup}>
              <Text style={styles.identityRoleTag}>PORTAL ASISTEN</Text>
              <Text style={styles.identityName}>
                {activeAssistant ? activeAssistant.name : 'Asisten Praktikum'}
              </Text>
              {activeAssistant ? (
                <Text style={styles.identitySub}>
                  NIM {activeAssistant.nim ?? '-'} • Kelas{' '}
                  {activeAssistant.className ?? '-'}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.switchRoleButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.switchRoleButtonText}>Ganti Peran ⇄</Text>
            </Pressable>
          </View>

          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.statBoxTotal]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Sesi</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxOpen]}>
              <Text style={[styles.statNumber, styles.statNumberOpen]}>
                {stats.open}
              </Text>
              <Text style={styles.statLabel}>Dibuka</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxUpcoming]}>
              <Text style={[styles.statNumber, styles.statNumberUpcoming]}>
                {stats.upcoming}
              </Text>
              <Text style={styles.statLabel}>Belum Dibuka</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxClosed]}>
              <Text style={[styles.statNumber, styles.statNumberClosed]}>
                {stats.closed}
              </Text>
              <Text style={styles.statLabel}>Ditutup</Text>
            </View>
          </View>

          {/* Filter Bar */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionHeading}>Daftar Sesi Praktikum</Text>
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
          </View>

          {/* Session List */}
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Tidak Ada Sesi Praktikum</Text>
              <Text style={styles.emptySubtitle}>
                Tidak ditemukan jadwal praktikum dengan filter status yang
                dipilih saat ini.
              </Text>
              {selectedFilter !== 'all' ? (
                <Pressable
                  onPress={() => setSelectedFilter('all')}
                  style={({ pressed }) => [
                    styles.resetFilterBtn,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.resetFilterBtnText}>
                    Tampilkan Semua Sesi
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
                    onPress={() =>
                      handleEnsureAssistantAndOpenSession(session.id)
                    }
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 680,
    gap: 16,
  },
  identityBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  identityTextGroup: {
    flex: 1,
    minWidth: 180,
  },
  identityRoleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identitySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  switchRoleButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  switchRoleButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxTotal: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  statBoxOpen: {
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  statBoxUpcoming: {
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  statBoxClosed: {
    borderLeftWidth: 4,
    borderLeftColor: '#64748B',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statNumberOpen: {
    color: '#166534',
  },
  statNumberUpcoming: {
    color: '#92400E',
  },
  statNumberClosed: {
    color: '#475569',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  filterSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  resetFilterBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
});
