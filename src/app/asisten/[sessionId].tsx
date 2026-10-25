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
import { ConfirmActionModal } from '../../components/asisten/ConfirmActionModal';
import { formatIndonesianDate } from '../../components/asisten/SessionCard';
import { StatusBadge } from '../../components/asisten/StatusBadge';
import { useAttendance } from '../../context/AttendanceContext';

export function formatCheckInTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function AsistenSessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    sessions,
    students,
    openSession,
    closeSession,
    getAttendanceForSession,
  } = useAttendance();

  const [pendingAction, setPendingAction] = useState<'open' | 'close' | null>(
    null
  );
  const [notice, setNotice] = useState<string | null>(null);

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

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Sesi tidak ditemukan.</Text>
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

  const totalParticipants = session.participantIds?.length ?? 0;

  const handleConfirmAction = () => {
    if (pendingAction === 'open') {
      openSession(session.id);
      setNotice('Sesi dibuka. Praktikan sudah bisa melakukan presensi.');
    } else if (pendingAction === 'close') {
      closeSession(session.id);
      setNotice('Sesi ditutup.');
    }
    setPendingAction(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {/* Detail Sesi */}
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
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Kehadiran</Text>
                <Text style={styles.infoValue}>
                  {sessionRecords.length}
                  {totalParticipants > 0 ? ` / ${totalParticipants}` : ''}{' '}
                  praktikan
                </Text>
              </View>
            </View>

            {/* Tombol Buka / Tutup Sesi */}
            <View style={styles.actionRow}>
              <Pressable
                disabled={session.status === 'open'}
                onPress={() => setPendingAction('open')}
                style={[
                  styles.actionBtn,
                  session.status === 'open'
                    ? styles.btnDisabled
                    : styles.openBtn,
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    session.status === 'open' && styles.btnTextDisabled,
                  ]}
                >
                  {session.status === 'open' ? 'Sedang Dibuka' : 'Buka Sesi'}
                </Text>
              </Pressable>

              <Pressable
                disabled={session.status !== 'open'}
                onPress={() => setPendingAction('close')}
                style={[
                  styles.actionBtn,
                  session.status !== 'open'
                    ? styles.btnDisabled
                    : styles.closeBtn,
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    session.status !== 'open' && styles.btnTextDisabled,
                  ]}
                >
                  Tutup Sesi
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Daftar Hadir */}
          <View style={styles.card}>
            <View style={styles.recapHeader}>
              <Text style={styles.sectionTitle}>
                Daftar Hadir ({sessionRecords.length})
              </Text>
              <Pressable
                onPress={() => router.push(`/asisten/rekap/${session.id}`)}
              >
                <Text style={styles.linkText}>Lihat Rekap →</Text>
              </Pressable>
            </View>

            {sessionRecords.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada praktikan yang melakukan presensi.
              </Text>
            ) : (
              <View style={styles.recordList}>
                {sessionRecords.map((record, index) => {
                  const student = students.find(
                    (s) => s.id === record.studentId
                  );
                  return (
                    <View
                      key={`${record.sessionId}-${record.studentId}`}
                      style={styles.recordItem}
                    >
                      <Text style={styles.recordNo}>{index + 1}.</Text>
                      <View style={styles.recordMain}>
                        <Text style={styles.recordName}>
                          {record.studentName}
                        </Text>
                        <Text style={styles.recordSub}>
                          {student?.nim ?? record.studentId}
                        </Text>
                      </View>
                      <Text style={styles.recordTime}>
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
        visible={pendingAction !== null}
        title={pendingAction === 'open' ? 'Buka Sesi?' : 'Tutup Sesi?'}
        description={
          pendingAction === 'open'
            ? `Buka presensi untuk ${session.practicalName} (${session.className})?`
            : `Tutup presensi untuk ${session.practicalName} (${session.className})?`
        }
        confirmLabel={pendingAction === 'open' ? 'Buka' : 'Tutup'}
        confirmTone={pendingAction === 'close' ? 'danger' : 'primary'}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
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
    padding: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
    gap: 14,
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  noticeText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  openBtn: {
    backgroundColor: '#16A34A',
  },
  closeBtn: {
    backgroundColor: '#DC2626',
  },
  btnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnTextDisabled: {
    color: '#64748B',
  },
  recapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    paddingVertical: 12,
  },
  recordList: {
    gap: 8,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  recordNo: {
    fontSize: 13,
    color: '#64748B',
    width: 22,
  },
  recordMain: {
    flex: 1,
  },
  recordName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  recordSub: {
    fontSize: 12,
    color: '#64748B',
  },
  recordTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
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
});
