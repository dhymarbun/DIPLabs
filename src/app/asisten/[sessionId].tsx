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
  return `${hours}:${minutes}:${seconds} WIB`;
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
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

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
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Sesi Tidak Ditemukan</Text>
          <Text style={styles.notFoundSubtitle}>
            Data sesi praktikum dengan ID &ldquo;{sessionId}&rdquo; tidak
            tersedia.
          </Text>
          <Pressable
            onPress={() => router.replace('/asisten')}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>← Kembali ke Daftar Sesi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalParticipants = session.participantIds?.length ?? 0;

  const handleConfirmAction = () => {
    if (pendingAction === 'open') {
      openSession(session.id);
      setFeedbackMessage({
        type: 'success',
        text: 'Sesi praktikum berhasil dibuka! Praktikan sekarang dapat melakukan presensi pada sesi ini.',
      });
    } else if (pendingAction === 'close') {
      closeSession(session.id);
      setFeedbackMessage({
        type: 'info',
        text: 'Sesi praktikum telah ditutup. Praktikan tidak dapat lagi mengirim presensi baru pada sesi ini.',
      });
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
          {/* Feedback Banner */}
          {feedbackMessage ? (
            <View
              style={[
                styles.feedbackBanner,
                feedbackMessage.type === 'success'
                  ? styles.feedbackSuccess
                  : styles.feedbackInfo,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedbackMessage.type === 'success'
                    ? styles.feedbackTextSuccess
                    : styles.feedbackTextInfo,
                ]}
              >
                {feedbackMessage.text}
              </Text>
            </View>
          ) : null}

          {/* Session Info Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  Kelas {session.className}
                </Text>
              </View>
              <StatusBadge status={session.status} />
            </View>

            <Text style={styles.sessionTitle}>{session.practicalName}</Text>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ID Sesi</Text>
                <Text style={styles.infoValue}>{session.id}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tanggal</Text>
                <Text style={styles.infoValue}>
                  {formatIndonesianDate(session.date)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Jam Praktikum</Text>
                <Text style={styles.infoValue}>
                  {session.startTime} – {session.endTime} WIB
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ruangan / Lokasi</Text>
                <Text style={styles.infoValue}>
                  {session.room ?? 'Belum ditentukan'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Asisten Bertugas</Text>
                <Text style={styles.infoValue}>
                  {session.assistantName ?? '-'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Kehadiran Saat Ini</Text>
                <Text style={styles.infoValueHighlight}>
                  {sessionRecords.length}
                  {totalParticipants > 0
                    ? ` dari ${totalParticipants} praktikan terdaftar`
                    : ' praktikan hadir'}
                </Text>
              </View>
            </View>
          </View>

          {/* Session Control Card (US-03 & US-08) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kontrol Status Sesi</Text>
            <Text style={styles.sectionDescription}>
              {session.status === 'upcoming'
                ? 'Sesi ini belum dibuka. Tekan tombol "Buka Sesi Praktikum" agar praktikan dapat melakukan presensi.'
                : session.status === 'open'
                ? 'Sesi sedang terbuka dan menerima presensi praktikan. Anda dapat menutup sesi setelah waktu presensi berakhir.'
                : 'Sesi ini telah ditutup. Presensi baru dinonaktifkan untuk praktikan, namun Anda dapat membuka kembali sesi jika diperlukan.'}
            </Text>

            <View style={styles.actionButtonsGroup}>
              {/* Open Session Button */}
              <Pressable
                disabled={session.status === 'open'}
                onPress={() => setPendingAction('open')}
                style={({ pressed }) => [
                  styles.actionBtn,
                  session.status === 'open'
                    ? styles.actionBtnDisabled
                    : styles.openBtn,
                  pressed &&
                    session.status !== 'open' &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    session.status === 'open' && styles.actionBtnTextDisabled,
                  ]}
                >
                  {session.status === 'open'
                    ? '✓ Sesi Sedang Dibuka'
                    : session.status === 'closed'
                    ? 'Buka Kembali Sesi Praktikum'
                    : 'Buka Sesi Praktikum'}
                </Text>
              </Pressable>

              {/* Close Session Button */}
              <Pressable
                disabled={session.status !== 'open'}
                onPress={() => setPendingAction('close')}
                style={({ pressed }) => [
                  styles.actionBtn,
                  session.status !== 'open'
                    ? styles.actionBtnDisabled
                    : styles.closeBtn,
                  pressed &&
                    session.status === 'open' &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    session.status !== 'open' && styles.actionBtnTextDisabled,
                  ]}
                >
                  {session.status === 'closed'
                    ? 'Sesi Sudah Ditutup'
                    : 'Tutup Sesi Praktikum'}
                </Text>
              </Pressable>
            </View>

            {/* Quick Role Switch Helper for Demo */}
            <View style={styles.demoHelperRow}>
              <Pressable
                onPress={() => router.push(`/asisten/rekap/${session.id}`)}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.secondaryBtnText}>
                  Lihat Halaman Rekap Lengkap →
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace('/')}
                style={({ pressed }) => [
                  styles.switchRoleOutlineBtn,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.switchRoleOutlineText}>
                  Ganti Peran (Uji Praktikan) ⇄
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Inline Attendance Recap Section (US-07) */}
          <View style={styles.card}>
            <View style={styles.recapHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Daftar Hadir Praktikan ({sessionRecords.length})
                </Text>
                <Text style={styles.recapSubtext}>
                  Rekap waktu kehadiran real-time selama aplikasi berjalan
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/asisten/rekap/${session.id}`)}
                style={({ pressed }) => [
                  styles.fullRecapBadge,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.fullRecapBadgeText}>Detail Rekap</Text>
              </Pressable>
            </View>

            {sessionRecords.length === 0 ? (
              <View style={styles.emptyRecapBox}>
                <Text style={styles.emptyRecapTitle}>
                  Belum Ada Praktikan yang Presensi
                </Text>
                <Text style={styles.emptyRecapDesc}>
                  {session.status === 'open'
                    ? 'Sesi sudah terbuka. Silakan beralih ke peran Praktikan untuk mencoba melakukan presensi pada sesi ini.'
                    : 'Buka sesi terlebih dahulu agar praktikan dapat mencatat kehadiran.'}
                </Text>
              </View>
            ) : (
              <View style={styles.recordList}>
                {sessionRecords.map((record, index) => {
                  const studentInfo = students.find(
                    (s) => s.id === record.studentId
                  );
                  return (
                    <View
                      key={`${record.sessionId}-${record.studentId}`}
                      style={styles.recordItem}
                    >
                      <View style={styles.recordIndexCircle}>
                        <Text style={styles.recordIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.recordMain}>
                        <Text style={styles.recordStudentName}>
                          {record.studentName}
                        </Text>
                        <Text style={styles.recordStudentMeta}>
                          NIM {studentInfo?.nim ?? record.studentId} • Kelas{' '}
                          {studentInfo?.className ?? session.className}
                        </Text>
                      </View>
                      <View style={styles.recordTimeBox}>
                        <Text style={styles.recordTimeLabel}>Waktu Hadir</Text>
                        <Text style={styles.recordTimeValue}>
                          {formatCheckInTime(record.checkedInAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        visible={pendingAction !== null}
        title={
          pendingAction === 'open'
            ? 'Buka Sesi Praktikum?'
            : 'Tutup Sesi Praktikum?'
        }
        description={
          pendingAction === 'open'
            ? `Status sesi "${session.practicalName}" (${session.className}) akan diubah menjadi SEDANG DIBUKA sehingga praktikan dapat melakukan presensi.`
            : `Status sesi "${session.practicalName}" (${session.className}) akan diubah menjadi SUDAH DITUTUP. Praktikan tidak akan bisa melakukan presensi lagi.`
        }
        confirmLabel={pendingAction === 'open' ? 'Ya, Buka Sesi' : 'Ya, Tutup Sesi'}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 680,
    gap: 16,
  },
  feedbackBanner: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  feedbackInfo: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextInfo: {
    color: '#334155',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 16,
  },
  infoList: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    minWidth: 120,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 16,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    minWidth: 200,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    backgroundColor: '#16A34A',
  },
  closeBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnTextDisabled: {
    color: '#64748B',
  },
  demoHelperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  secondaryBtn: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  switchRoleOutlineBtn: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchRoleOutlineText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  recapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  recapSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  fullRecapBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fullRecapBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  emptyRecapBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyRecapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyRecapDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  recordList: {
    gap: 10,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  recordIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  recordMain: {
    flex: 1,
  },
  recordStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordStudentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recordTimeBox: {
    alignItems: 'flex-end',
  },
  recordTimeLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  recordTimeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
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
