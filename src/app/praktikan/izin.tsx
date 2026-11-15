import React, { useEffect, useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { usePermissions } from '../../context/PermissionContext';

const STATUS_LABELS = {
  pending: 'Menunggu keputusan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
} as const;

const STATUS_COLORS = {
  pending: '#B45309',
  approved: '#15803D',
  rejected: '#B91C1C',
} as const;

export default function PraktikanPermissionHistoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { authUser } = useAuth();
  const { sessions } = useAttendance();
  const { myPermissions, permissionsLoading, permissionsError } = usePermissions();

  useEffect(() => {
    navigation.setOptions({ title: 'Pengajuan Izin' });
  }, [navigation]);

  const sessionNames = useMemo(
    () => new Map(sessions.map((session) => [session.id, session.practicalName])),
    [sessions]
  );

  if (!authUser || authUser.role !== 'praktikan') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Masuk sebagai praktikan</Text>
          <Text style={styles.subtitle}>Login terlebih dahulu untuk melihat pengajuan izin.</Text>
          <Pressable onPress={() => router.replace('/auth/login')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Masuk</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Riwayat Pengajuan</Text>
            <Text style={styles.subtitle}>Pantau keputusan asisten secara real-time.</Text>
          </View>
          <Pressable onPress={() => router.replace('/praktikan')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Jadwal</Text>
          </Pressable>
        </View>

        {permissionsLoading ? (
          <View style={styles.card}><Text style={styles.subtitle}>Memuat pengajuan izin...</Text></View>
        ) : permissionsError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Pengajuan tidak dapat dimuat</Text>
            <Text style={styles.errorText}>{permissionsError}</Text>
          </View>
        ) : myPermissions.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>Belum ada pengajuan izin</Text>
            <Text style={styles.subtitle}>Ajukan izin dari halaman detail sesi.</Text>
          </View>
        ) : (
          myPermissions.map((permission) => (
            <View key={permission.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.sessionName}>
                  {sessionNames.get(permission.sessionId) ?? permission.sessionId}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLORS[permission.status] }]}>
                  {STATUS_LABELS[permission.status]}
                </Text>
              </View>
              <Text style={styles.reason}>{permission.reason}</Text>
              <Text style={styles.aiText}>
                Klasifikasi AI: {permission.aiCategory ?? 'tidak diketahui'}
                {permission.aiConfidence !== undefined
                  ? ` (${Math.round(permission.aiConfidence * 100)}%)`
                  : ''}
              </Text>
              {permission.reviewerNote ? (
                <Text style={styles.note}>Catatan asisten: {permission.reviewerNote}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 12, alignSelf: 'center', width: '100%', maxWidth: 640 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  errorCard: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#FECACA', gap: 4 },
  errorTitle: { color: '#991B1B', fontWeight: '700' },
  errorText: { color: '#B91C1C', fontSize: 13 },
  emptyTitle: { color: '#1E293B', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  sessionName: { flex: 1, color: '#0F172A', fontWeight: '700', fontSize: 15 },
  status: { fontSize: 12, fontWeight: '700' },
  reason: { color: '#334155', fontSize: 13, lineHeight: 19 },
  aiText: { color: '#64748B', fontSize: 12 },
  note: { color: '#475569', fontSize: 12, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryButtonText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
});
