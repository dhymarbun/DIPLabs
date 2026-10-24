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
import { PraktikanSessionCard } from '../../components/praktikan/PraktikanSessionCard';
import { useAttendance } from '../../context/AttendanceContext';

export default function PraktikanScheduleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { currentUser, sessions, getAttendanceForStudent } = useAttendance();

  useEffect(() => {
    navigation.setOptions({ title: 'Jadwal Praktikum' });
  }, [navigation]);

  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return getAttendanceForStudent(currentUser.id);
  }, [currentUser, getAttendanceForStudent]);

  const isPraktikan = currentUser?.role === 'praktikan';

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

          {filteredSessions.length === 0 ? (
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
