import React, { useEffect, useMemo, useState } from 'react';
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
import { formatCheckInTime } from './riwayat';
import { RecordAttendanceFailureReason } from '../../types/attendance';

const FAILURE_MESSAGES: Record<RecordAttendanceFailureReason, string> = {
  'session-not-open':
    'Sesi belum dibuka atau sudah ditutup. Tunggu asisten membuka sesi.',
  'already-recorded':
    'Anda sudah melakukan presensi pada sesi ini. Presensi tidak bisa diulang.',
  'user-not-found':
    'Identitas praktikan tidak ditemukan. Silakan keluar dan masuk kembali.',
};

export default function PraktikanSessionDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const {
    currentUser,
    sessions,
    recordAttendance,
    getAttendanceForStudent,
  } = useAttendance();

  useEffect(() => {
    navigation.setOptions({ title: 'Detail Sesi' });
  }, [navigation]);

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );

  const myRecord = useMemo(() => {
    if (!currentUser || !session) return undefined;
    return getAttendanceForStudent(currentUser.id).find(
      (r) => r.sessionId === session.id
    );
  }, [currentUser, session, getAttendanceForStudent]);

  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const isPraktikan = currentUser?.role === 'praktikan';
  const canCheckIn =
    isPraktikan && session?.status === 'open' && !myRecord;

  const isParticipant = session?.participantIds?.includes(
    currentUser?.id ?? ''
  );

  const handlePresensi = () => {
    if (!session || !currentUser) return;
    const result = recordAttendance(session.id, currentUser.id);
    if (result.ok) {
      setFeedback({
        tone: 'success',
        text: `Presensi berhasil dicatat pada ${formatCheckInTime(
          result.record.checkedInAt
        )}.`,
      });
    } else {
      setFeedback({ tone: 'error', text: FAILURE_MESSAGES[result.reason] });
    }
  };

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

  if (!isPraktikan || !currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guard}>
          <Text style={styles.guardTitle}>Masuk sebagai praktikan</Text>
          <Text style={styles.guardSubtitle}>
            Pilih akun praktikan terlebih dahulu untuk melakukan presensi.
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
          {feedback ? (
            <View
              style={[
                styles.noticeBox,
                feedback.tone === 'success'
                  ? styles.noticeSuccess
                  : styles.noticeError,
              ]}
            >
              <Text
                style={[
                  styles.noticeText,
                  feedback.tone === 'success'
                    ? styles.noticeTextSuccess
                    : styles.noticeTextError,
                ]}
              >
                {feedback.text}
              </Text>
            </View>
          ) : null}

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

            {isParticipant === false ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Anda tidak terdaftar sebagai peserta sesi ini. Presensi tetap
                  dapat dicoba, namun asisten mungkin tidak mengikutsertakan
                  Anda.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Presensi</Text>

            {myRecord ? (
              <View style={styles.checkedInBox}>
                <Text style={styles.checkedInTitle}>Sudah presensi</Text>
                <Text style={styles.checkedInTime}>
                  {formatCheckInTime(myRecord.checkedInAt)}
                </Text>
                <Text style={styles.checkedInSub}>
                  Kehadiran Anda tercatat pada sesi ini.
                </Text>
              </View>
            ) : session.status === 'upcoming' ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Sesi belum dibuka</Text>
                <Text style={styles.infoBoxSub}>
                  Asisten belum membuka presensi. Tombol presensi akan aktif
                  begitu sesi dibuka.
                </Text>
              </View>
            ) : session.status === 'closed' ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Sesi sudah ditutup</Text>
                <Text style={styles.infoBoxSub}>
                  Masa presensi untuk sesi ini telah berakhir.
                </Text>
              </View>
            ) : (
              <Pressable
                disabled={!canCheckIn}
                onPress={handlePresensi}
                style={({ pressed }) => [
                  styles.presensiBtn,
                  !canCheckIn && styles.presensiBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.presensiBtnText,
                    !canCheckIn && styles.presensiBtnTextDisabled,
                  ]}
                >
                  Lakukan Presensi
                </Text>
              </Pressable>
            )}
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
  noticeBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  noticeSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  noticeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noticeTextSuccess: {
    color: '#166534',
  },
  noticeTextError: {
    color: '#991B1B',
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
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  presensiBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  presensiBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  presensiBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  presensiBtnTextDisabled: {
    color: '#64748B',
  },
  checkedInBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  checkedInTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  checkedInTime: {
    fontSize: 24,
    fontWeight: '800',
    color: '#14532D',
    marginTop: 4,
  },
  checkedInSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  infoBoxSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
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
  pressed: {
    opacity: 0.85,
  },
});
