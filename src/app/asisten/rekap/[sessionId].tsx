import React, { useMemo, useState } from 'react';
import {
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

export default function AsistenSessionRecapScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    sessions,
    students,
    closeSession,
    getAttendanceForSession,
  } = useAttendance();

  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [closedBanner, setClosedBanner] = useState(false);

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

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Rekap Sesi Tidak Ditemukan</Text>
          <Pressable
            onPress={() => router.replace('/asisten')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Kembali ke Jadwal Asisten</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalRegistered = registeredParticipants.length;
  const presentCount = sessionRecords.length;
  const absentCount = Math.max(0, totalRegistered - presentCount);

  const handleConfirmClose = () => {
    closeSession(session.id);
    setConfirmCloseVisible(false);
    setClosedBanner(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {closedBanner ? (
            <View style={styles.closedBanner}>
              <Text style={styles.closedBannerText}>
                Sesi praktikum telah ditutup. Rekap presensi di bawah bersifat
                final untuk sesi ini.
              </Text>
            </View>
          ) : null}

          {/* Header Summary Card */}
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.classTag}>Kelas {session.className}</Text>
              <StatusBadge status={session.status} />
            </View>
            <Text style={styles.title}>{session.practicalName}</Text>
            <Text style={styles.subtitle}>
              {formatIndonesianDate(session.date)} • {session.startTime} –{' '}
              {session.endTime} WIB
            </Text>
            {session.room ? (
              <Text style={styles.subtitle}>{session.room}</Text>
            ) : null}

            <View style={styles.metricsRow}>
              <View style={[styles.metricBox, styles.metricPresent]}>
                <Text style={styles.metricValuePresent}>{presentCount}</Text>
                <Text style={styles.metricLabel}>Sudah Presensi</Text>
              </View>
              <View style={[styles.metricBox, styles.metricAbsent]}>
                <Text style={styles.metricValueAbsent}>{absentCount}</Text>
                <Text style={styles.metricLabel}>Belum Hadir</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValueTotal}>{totalRegistered}</Text>
                <Text style={styles.metricLabel}>Terdaftar</Text>
              </View>
            </View>

            {session.status === 'open' ? (
              <Pressable
                onPress={() => setConfirmCloseVisible(true)}
                style={({ pressed }) => [
                  styles.closeSessionBtn,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.closeSessionBtnText}>
                  Tutup Sesi Praktikum Sekarang
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Chronological Attendance Log */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Log Waktu Kehadiran ({sessionRecords.length})
            </Text>
            <Text style={styles.sectionSub}>
              Diurutkan berdasarkan waktu presensi praktikan
            </Text>

            {sessionRecords.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>
                  Belum Ada Catatan Kehadiran
                </Text>
                <Text style={styles.emptyDesc}>
                  Belum ada praktikan yang melakukan presensi pada sesi ini.
                </Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {sessionRecords.map((record, idx) => {
                  const student = students.find(
                    (s) => s.id === record.studentId
                  );
                  return (
                    <View
                      key={`${record.sessionId}-${record.studentId}`}
                      style={styles.logRow}
                    >
                      <View style={styles.logNumberBadge}>
                        <Text style={styles.logNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.logInfo}>
                        <Text style={styles.logName}>{record.studentName}</Text>
                        <Text style={styles.logMeta}>
                          NIM: {student?.nim ?? record.studentId} • Kelas:{' '}
                          {student?.className ?? session.className}
                        </Text>
                      </View>
                      <View style={styles.logTimePill}>
                        <Text style={styles.logTimeText}>
                          {formatCheckInTime(record.checkedInAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Full Class Roster Status */}
          {registeredParticipants.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Status Peserta Terdaftar ({registeredParticipants.length})
              </Text>
              <Text style={styles.sectionSub}>
                Perbandingan daftar peserta kelas dengan catatan presensi
              </Text>

              <View style={styles.listContainer}>
                {registeredParticipants.map((participant) => {
                  const attendanceRecord = sessionRecords.find(
                    (r) => r.studentId === participant.id
                  );
                  const isPresent = Boolean(attendanceRecord);

                  return (
                    <View key={participant.id} style={styles.rosterRow}>
                      <View style={styles.logInfo}>
                        <Text style={styles.logName}>{participant.name}</Text>
                        <Text style={styles.logMeta}>
                          NIM: {participant.nim ?? '-'} • Kelas:{' '}
                          {participant.className ?? '-'}
                        </Text>
                      </View>
                      {isPresent && attendanceRecord ? (
                        <View style={styles.presentBadge}>
                          <Text style={styles.presentBadgeText}>
                            Hadir •{' '}
                            {formatCheckInTime(attendanceRecord.checkedInAt)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.absentBadge}>
                          <Text style={styles.absentBadgeText}>
                            Belum Presensi
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmActionModal
        visible={confirmCloseVisible}
        title="Tutup Sesi Praktikum?"
        description={`Apakah Anda yakin ingin menutup sesi "${session.practicalName}"? Setelah ditutup, praktikan tidak dapat lagi melakukan presensi.`}
        confirmLabel="Ya, Tutup Sesi"
        confirmTone="danger"
        onCancel={() => setConfirmCloseVisible(false)}
        onConfirm={handleConfirmClose}
      />
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
  closedBanner: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
  },
  closedBannerText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  classTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricPresent: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  metricAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  metricValuePresent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
  },
  metricValueAbsent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#991B1B',
  },
  metricValueTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  closeSessionBtn: {
    marginTop: 16,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeSessionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  emptyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  listContainer: {
    gap: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  logNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  logMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logTimePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  presentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  absentBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  absentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
