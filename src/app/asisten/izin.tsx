import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { usePermissions } from '../../context/PermissionContext';
import { PermissionStatus } from '../../types/attendance';
import { colors } from '../../theme/tokens';

type FilterStatus = 'all' | PermissionStatus;

const STATUS_LABELS: Record<PermissionStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export default function AsistenPermissionReviewScreen() {
  const router = useRouter();
  const { authUser } = useAuth();
  const { sessions } = useAttendance();
  const {
    allPermissions,
    permissionsLoading,
    permissionsError,
    reviewPermission,
  } = usePermissions();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return allPermissions;
    return allPermissions.filter((r) => r.status === filter);
  }, [allPermissions, filter]);

  const handleDecision = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    setProcessingId(requestId);
    setFeedback(null);
    try {
      await reviewPermission(requestId, decision, notesById[requestId]);
      setFeedback({
        message:
          decision === 'approved'
            ? 'Pengajuan izin disetujui.'
            : 'Pengajuan izin ditolak.',
        isError: false,
      });
    } catch (err) {
      setFeedback({
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan keputusan izin ke Firestore.',
        isError: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!authUser || authUser.role !== 'asisten') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.guardTitle}>Akses Khusus Asisten</Text>
          <Pressable
            onPress={() => router.replace('/auth/login')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Masuk</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Filter Status */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(
              [
                { key: 'all', label: 'Semua' },
                { key: 'pending', label: 'Menunggu' },
                { key: 'approved', label: 'Disetujui' },
                { key: 'rejected', label: 'Ditolak' },
              ] as { key: FilterStatus; label: string }[]
            ).map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {permissionsError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{permissionsError}</Text>
            </View>
          ) : null}

          {feedback ? (
            <View
              style={[
                styles.feedbackBox,
                feedback.isError && styles.errorBox,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.isError && styles.errorText,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          {permissionsLoading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={[styles.emptyText, { marginTop: 8 }]}>
                Memuat daftar pengajuan izin...
              </Text>
            </View>
          ) : filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Belum ada pengajuan izin</Text>
              <Text style={styles.emptyText}>
                Pengajuan izin dari praktikan akan tampil di sini secara
                real-time.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredRequests.map((req) => {
                const session = sessions.find((s) => s.id === req.sessionId);
                const isBusy = processingId === req.id;

                return (
                  <View key={req.id} style={styles.card}>
                    <View style={styles.topRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>
                          {req.studentName}
                        </Text>
                        <Text style={styles.sessionSub}>
                          {session
                            ? `${session.practicalName} (${session.className})`
                            : `Sesi ID: ${req.sessionId}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          req.status === 'approved'
                            ? styles.statusApproved
                            : req.status === 'rejected'
                            ? styles.statusRejected
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            req.status === 'approved'
                              ? styles.statusTextApproved
                              : req.status === 'rejected'
                              ? styles.statusTextRejected
                              : styles.statusTextPending,
                          ]}
                        >
                          {STATUS_LABELS[req.status]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonLabel}>Alasan Izin:</Text>
                      <Text style={styles.reasonText}>{req.reason}</Text>
                    </View>

                    {/* Informasi Pendukung Klasifikasi AI */}
                    <View style={styles.aiBox}>
                      <Text style={styles.aiLabel}>
                        Klasifikasi AI (Informasi Pendukung):
                      </Text>
                      <Text style={styles.aiValue}>
                        Kategori: {req.aiCategory ?? 'tidak_diketahui'}
                        {typeof req.aiConfidence === 'number'
                          ? ` (${Math.round(req.aiConfidence * 100)}%)`
                          : ''}
                      </Text>
                    </View>

                    {req.status === 'pending' ? (
                      <View style={styles.reviewSection}>
                        <TextInput
                          value={notesById[req.id] ?? ''}
                          onChangeText={(val) =>
                            setNotesById((prev) => ({ ...prev, [req.id]: val }))
                          }
                          placeholder="Catatan asisten (opsional)"
                          placeholderTextColor="#94A3B8"
                          style={styles.noteInput}
                        />
                        <View style={styles.decisionRow}>
                          <Pressable
                            disabled={isBusy}
                            onPress={() => handleDecision(req.id, 'approved')}
                            style={[styles.decisionBtn, styles.approveBtn]}
                          >
                            <Text style={styles.decisionBtnText}>Terima</Text>
                          </Pressable>
                          <Pressable
                            disabled={isBusy}
                            onPress={() => handleDecision(req.id, 'rejected')}
                            style={[styles.decisionBtn, styles.rejectBtn]}
                          >
                            <Text style={styles.decisionBtnText}>Tolak</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.reviewedMeta}>
                        <Text style={styles.reviewedMetaText}>
                          Diputuskan oleh {req.reviewedBy ?? 'Asisten'}
                          {req.reviewerNote
                            ? ` • Catatan: "${req.reviewerNote}"`
                            : ''}
                        </Text>
                      </View>
                    )}
                  </View>
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
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  guardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  primaryBtn: { backgroundColor: colors.yellow, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 },
  primaryBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  filterChipTextActive: { color: colors.ink },
  errorBox: { backgroundColor: colors.rose, borderColor: colors.rose, borderWidth: 1, borderRadius: 20, padding: 12 },
  errorText: { color: colors.ink, fontSize: 12 },
  feedbackBox: { backgroundColor: colors.success, borderColor: colors.success, borderWidth: 1, borderRadius: 20, padding: 12 },
  feedbackText: { color: colors.successInk, fontSize: 13, fontWeight: '600' },
  emptyCard: { backgroundColor: colors.card, borderRadius: 28, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  list: { gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 28, padding: 20, gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  studentName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sessionSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusPending: { backgroundColor: colors.yellowSoft },
  statusApproved: { backgroundColor: colors.success },
  statusRejected: { backgroundColor: colors.rose },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusTextPending: { color: colors.ink },
  statusTextApproved: { color: colors.successInk },
  statusTextRejected: { color: colors.danger },
  reasonBox: { backgroundColor: colors.canvas, borderRadius: 20, padding: 10 },
  reasonLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 2 },
  reasonText: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  aiBox: { backgroundColor: colors.lavender, borderRadius: 20, padding: 10 },
  aiLabel: { fontSize: 11, fontWeight: '600', color: colors.ink },
  aiValue: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 2 },
  reviewSection: { gap: 8, marginTop: 2 },
  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.ink, backgroundColor: colors.canvas },
  decisionRow: { flexDirection: 'row', gap: 10 },
  decisionBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center' },
  approveBtn: { backgroundColor: colors.successInk },
  rejectBtn: { backgroundColor: colors.danger },
  decisionBtnText: { color: colors.card, fontSize: 13, fontWeight: '700' },
  reviewedMeta: { borderTopWidth: 1, borderColor: colors.canvas, paddingTop: 8 },
  reviewedMetaText: { fontSize: 12, color: colors.muted },
});
