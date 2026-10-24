import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBadge } from '../../components/asisten/StatusBadge';
import { formatIndonesianDate } from '../../components/asisten/SessionCard';
import { useAttendance } from '../../context/AttendanceContext';

export default function PraktikanSessionDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { sessions } = useAttendance();

  useEffect(() => {
    navigation.setOptions({ title: 'Detail Sesi' });
  }, [navigation]);

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Sesi tidak ditemukan.</Text>
          <Pressable
            onPress={() => router.replace('/praktikan')}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Text style={styles.backBtnText}>Kembali</Text>
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
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.classBadge}>{session.className}</Text>
              <StatusBadge status={session.status} />
            </View>

            <Text style={styles.title}>{session.practicalName}</Text>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tanggal</Text>
                <Text style={styles.infoValue}>
                  {formatIndonesianDate(session.date)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Waktu</Text>
                <Text style={styles.infoValue}>
                  {session.startTime} – {session.endTime} WIB
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ruangan</Text>
                <Text style={styles.infoValue}>{session.room ?? '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Asisten</Text>
                <Text style={styles.infoValue}>
                  {session.assistantName ?? '-'}
                </Text>
              </View>
            </View>
          </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  infoList: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  notFoundText: {
    fontSize: 15,
    color: '#475569',
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
