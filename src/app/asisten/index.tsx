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
  { key: 'open', label: 'Dibuka' },
  { key: 'upcoming', label: 'Belum Dibuka' },
  { key: 'closed', label: 'Ditutup' },
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

  const filteredSessions = useMemo(() => {
    if (selectedFilter === 'all') return sessions;
    return sessions.filter((s) => s.status === selectedFilter);
  }, [sessions, selectedFilter]);

  const handleOpenDetail = (sessionId: string) => {
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
          {/* User Header */}
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.greeting}>
                {activeAssistant ? activeAssistant.name : 'Asisten'}
              </Text>
              {activeAssistant ? (
                <Text style={styles.profileSub}>
                  Asisten • {activeAssistant.nim} ({activeAssistant.className})
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.logoutBtnText}>Ganti Akun</Text>
            </Pressable>
          </View>

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
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Tidak ada jadwal</Text>
              <Text style={styles.emptySubtitle}>
                Belum ada sesi praktikum untuk filter ini.
              </Text>
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
                    onPress={() => handleOpenDetail(session.id)}
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
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
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
  },
});
