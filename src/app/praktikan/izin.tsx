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
    navigation.setOptions({ title: 'Pengajuan Izin', headerShown: false });
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
        <Pressable onPress={() => router.back()}><Text style={styles.backText}>‹  Kembali</Text></Pressable>
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
  safeArea: { flex: 1, backgroundColor: '#F2F1ED' },
  content: { padding: 24, gap: 16, alignSelf: 'center', width: '100%', maxWidth: 640 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '500', color: '#232420' },
  subtitle: { color: '#5E5F58', fontSize: 13, lineHeight: 19, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, gap: 10 },
  errorCard: { backgroundColor: '#F1D3CC', borderRadius: 28, padding: 20, gap: 6 },
  errorTitle: { color: '#232420', fontWeight: '700' },
  errorText: { color: '#5E5F58', fontSize: 13 },
  emptyTitle: { color: '#232420', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  sessionName: { flex: 1, color: '#232420', fontWeight: '700', fontSize: 15 },
  status: { fontSize: 12, fontWeight: '700' },
  reason: { color: '#334155', fontSize: 13, lineHeight: 19 },
  aiText: { color: '#5E5F58', fontSize: 12 },
  note: { color: '#5E5F58', fontSize: 12, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  primaryButton: { backgroundColor: '#FFC332', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 13, marginTop: 8 },
  primaryButtonText: { color: '#232420', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#FFE4A1', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  secondaryButtonText: { color: '#232420', fontWeight: '700', fontSize: 12 },
  backText: { color: '#5E5F58', fontWeight: '600', paddingVertical: 8 },
});
