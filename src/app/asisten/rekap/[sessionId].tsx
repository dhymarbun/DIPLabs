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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ConfirmActionModal } from '../../../components/asisten/ConfirmActionModal';
import { formatIndonesianDate } from '../../../components/asisten/SessionCard';
import { StatusBadge } from '../../../components/asisten/StatusBadge';
import { useAttendance } from '../../../context/AttendanceContext';
import { formatCheckInTime } from '../[sessionId]';
import { colors } from '../../../theme/tokens';

export default function AsistenSessionRecapScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    sessions,
    sessionsLoading,
    students,
    closeSession,
    getAttendanceForSession,
  } = useAttendance();

  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );

  const sessionRecords = useMemo(() => {
    if (!session) return [];
    return [...getAttendanceForSession(session.id)].sort((a, b) =>
      a.checkedInAt.localeCompare(b.checkedInAt)
    );
  }, [session, getAttendanceForSession]);

  const registeredParticipants = useMemo(() => {
    if (!session?.participantIds) return [];
    return students.filter((std) => session.participantIds?.includes(std.id));
  }, [session, students]);

  if (sessionsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.notFoundText}>Memuat rekap sesi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Data sesi tidak ditemukan.</Text>
          <Pressable
            onPress={() => router.replace('/asisten')}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalRegistered = registeredParticipants.length;
  const presentCount = sessionRecords.length;
  const absentCount = Math.max(0, totalRegistered - presentCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.classTag}>{session.className}</Text>
              <StatusBadge status={session.status} />
            </View>
            <Text style={styles.title}>{session.practicalName}</Text>
            <Text style={styles.subtitle}>
              {formatIndonesianDate(session.date)} • {session.startTime}–
              {session.endTime} WIB
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricPresent}>{presentCount}</Text>
                <Text style={styles.metricLabel}>Hadir</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricAbsent}>{absentCount}</Text>
                <Text style={styles.metricLabel}>Belum Hadir</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricTotal}>{totalRegistered}</Text>
                <Text style={styles.metricLabel}>Terdaftar</Text>
              </View>
            </View>

            {session.status === 'open' ? (
              <Pressable
                disabled={closing}
                onPress={() => setConfirmCloseVisible(true)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>
                  {closing ? 'Menutup Sesi...' : 'Tutup Sesi'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Praktikan Hadir ({sessionRecords.length})
            </Text>

            {sessionRecords.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada catatan presensi pada sesi ini.
              </Text>
            ) : (
              <View style={styles.list}>
                {sessionRecords.map((record, idx) => {
                  const student = students.find(
                    (s) => s.id === record.studentId
                  );
                  return (
                    <View
                      key={`${record.sessionId}-${record.studentId}`}
                      style={styles.row}
                    >
                      <Text style={styles.rowNo}>{idx + 1}.</Text>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowName}>{record.studentName}</Text>
                        <Text style={styles.rowSub}>
                          {student?.nim ?? record.studentId}
                        </Text>
                      </View>
                      <Text style={styles.rowTime}>
                        {formatCheckInTime(record.checkedInAt)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmActionModal
        visible={confirmCloseVisible}
        title="Tutup Sesi?"
        description={`Tutup presensi untuk ${session.practicalName}?`}
        confirmLabel="Tutup"
        confirmTone="danger"
        onCancel={() => setConfirmCloseVisible(false)}
        onConfirm={async () => {
          setConfirmCloseVisible(false);
          setClosing(true);
          try {
            await closeSession(session.id);
          } finally {
            setClosing(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: colors.card },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  classTag: { fontSize: 12, fontWeight: '700', color: colors.ink, backgroundColor: colors.sage, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  title: { fontSize: 22, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.muted },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricBox: { flex: 1, backgroundColor: colors.canvas, borderRadius: 20, padding: 10, alignItems: 'center' },
  metricPresent: { fontSize: 18, fontWeight: '700', color: colors.successInk },
  metricAbsent: { fontSize: 18, fontWeight: '700', color: colors.danger },
  metricTotal: { fontSize: 18, fontWeight: '700', color: colors.ink },
  metricLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  closeBtn: { marginTop: 14, backgroundColor: colors.danger, paddingVertical: 13, borderRadius: 999, alignItems: 'center' },
  closeBtnText: { color: colors.card, fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.ink, marginBottom: 10 },
  emptyText: { fontSize: 13, color: colors.muted, paddingVertical: 8 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.canvas, gap: 8 },
  rowNo: { fontSize: 13, color: colors.muted, width: 22 },
  rowMain: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12, color: colors.muted },
  rowTime: { fontSize: 13, fontWeight: '600', color: colors.successInk },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
  notFoundText: { fontSize: 15, color: colors.muted },
  backBtn: { backgroundColor: colors.yellow, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  backBtnText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
});
