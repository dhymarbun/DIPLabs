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
import { PracticumSession } from '../../types/attendance';

type TabKey = 'sessions' | 'classes' | 'participants';

export default function ManagePracticumScreen() {
  const router = useRouter();
  const { authUser } = useAuth();
  const {
    sessions,
    classes,
    participants,
    students,
    addSession,
    updateSession,
    deleteSession,
    addClass,
    deleteClass,
    addParticipant,
    removeParticipant,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<TabKey>('sessions');
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Session form state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [practicalName, setPracticalName] = useState<string>('');
  const [className, setClassName] = useState<string>('K-01');
  const [date, setDate] = useState<string>('2026-11-12');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [room, setRoom] = useState<string>('Lab Dasar 2');

  // Class form state
  const [newClassName, setNewClassName] = useState<string>('');

  // Participant form state
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id ?? 'K-01'
  );
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentNimInput, setStudentNimInput] = useState<string>('');

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setPracticalName('');
    setClassName('K-01');
    setDate('2026-11-12');
    setStartTime('08:00');
    setEndTime('10:00');
    setRoom('Lab Dasar 2');
  };

  const handleEditSession = (s: PracticumSession) => {
    setEditingSessionId(s.id);
    setPracticalName(s.practicalName);
    setClassName(s.className);
    setDate(s.date);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setRoom(s.room ?? '');
  };

  const handleSaveSession = async () => {
    if (!practicalName.trim() || !className.trim() || !date.trim()) {
      setFeedback('Nama praktikum, kelas, dan tanggal wajib diisi.');
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const classParticipants = participants
        .filter((p) => p.classId === className.trim())
        .map((p) => p.studentId);

      if (editingSessionId) {
        await updateSession(editingSessionId, {
          practicalName: practicalName.trim(),
          className: className.trim(),
          date: date.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          room: room.trim() || undefined,
        });
        setFeedback('Sesi berhasil diperbarui.');
      } else {
        await addSession({
          practicalName: practicalName.trim(),
          className: className.trim(),
          date: date.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          room: room.trim() || undefined,
          assistantId: authUser?.uid,
          assistantName: authUser?.name,
          participantIds: classParticipants,
        });
        setFeedback('Sesi baru berhasil ditambahkan.');
      }
      resetSessionForm();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Gagal menyimpan data sesi.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      await deleteSession(sessionId);
      setFeedback('Sesi berhasil dihapus.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Gagal menghapus sesi.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      setFeedback('Nama kelas wajib diisi.');
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await addClass({
        name: newClassName.trim(),
        assistantIds: authUser ? [authUser.uid] : [],
      });
      setNewClassName('');
      setFeedback('Kelas baru berhasil ditambahkan.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Gagal menambahkan kelas.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAddParticipant = async () => {
    const cId = selectedClassId.trim() || classes[0]?.name || 'K-01';
    const sId = studentIdInput.trim();
    const sName = studentNameInput.trim();
    if (!sId || !sName) {
      setFeedback('UID/ID praktikan dan nama praktikan wajib diisi.');
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await addParticipant({
        classId: cId,
        studentId: sId,
        studentName: sName,
        nim: studentNimInput.trim() || undefined,
      });
      setStudentIdInput('');
      setStudentNameInput('');
      setStudentNimInput('');
      setFeedback('Peserta berhasil ditambahkan ke kelas.');
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Gagal menambahkan peserta.'
      );
    } finally {
      setBusy(false);
    }
  };

  const registeredStudentsHint = useMemo(
    () => students.slice(0, 8),
    [students]
  );

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
          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setActiveTab('sessions')}
              style={[
                styles.tabBtn,
                activeTab === 'sessions' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'sessions' && styles.tabTextActive,
                ]}
              >
                Jadwal & Sesi ({sessions.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('classes')}
              style={[
                styles.tabBtn,
                activeTab === 'classes' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'classes' && styles.tabTextActive,
                ]}
              >
                Kelas ({classes.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('participants')}
              style={[
                styles.tabBtn,
                activeTab === 'participants' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'participants' && styles.tabTextActive,
                ]}
              >
                Peserta ({participants.length})
              </Text>
            </Pressable>
          </View>

          {feedback ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}

          {activeTab === 'sessions' ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {editingSessionId ? 'Ubah Sesi Praktikum' : 'Tambah Sesi Baru'}
                </Text>

                <Text style={styles.label}>Nama Modul / Praktikum</Text>
                <TextInput
                  value={practicalName}
                  onChangeText={setPracticalName}
                  placeholder="Contoh: Modul 3: Segmentasi Citra"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Kelas</Text>
                    <TextInput
                      value={className}
                      onChangeText={setClassName}
                      placeholder="K-01"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="2026-11-12"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Jam Mulai</Text>
                    <TextInput
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="08:00"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Jam Selesai</Text>
                    <TextInput
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="10:00"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Ruangan</Text>
                <TextInput
                  value={room}
                  onChangeText={setRoom}
                  placeholder="Lab Dasar 2"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />

                <View style={styles.formActionRow}>
                  {editingSessionId ? (
                    <Pressable
                      onPress={resetSessionForm}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryBtnText}>Batal</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={handleSaveSession}
                    disabled={busy}
                    style={[styles.primaryBtn, { flex: 1 }]}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {editingSessionId ? 'Simpan Perubahan' : 'Tambah Sesi'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Sesi</Text>
                {sessions.length === 0 ? (
                  <Text style={styles.emptyText}>Belum ada sesi terdaftar.</Text>
                ) : (
                  <View style={styles.itemList}>
                    {sessions.map((s) => (
                      <View key={s.id} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{s.practicalName}</Text>
                          <Text style={styles.itemSub}>
                            {s.className} • {s.date} ({s.startTime}–{s.endTime})
                          </Text>
                        </View>
                        <View style={styles.itemActions}>
                          <Pressable
                            onPress={() => handleEditSession(s)}
                            style={styles.editBadge}
                          >
                            <Text style={styles.editBadgeText}>Ubah</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSession(s.id)}
                            style={styles.deleteBadge}
                          >
                            <Text style={styles.deleteBadgeText}>Hapus</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'classes' ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tambah Kelas Praktikum</Text>
                <Text style={styles.label}>Nama Kelas</Text>
                <TextInput
                  value={newClassName}
                  onChangeText={setNewClassName}
                  placeholder="Contoh: K-03"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
                <Pressable
                  onPress={handleAddClass}
                  disabled={busy}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Tambah Kelas</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Kelas</Text>
                {classes.length === 0 ? (
                  <Text style={styles.emptyText}>Belum ada data kelas.</Text>
                ) : (
                  <View style={styles.itemList}>
                    {classes.map((c) => (
                      <View key={c.id} style={styles.itemRow}>
                        <Text style={styles.itemTitle}>Kelas {c.name}</Text>
                        <Pressable
                          onPress={() => deleteClass(c.id)}
                          style={styles.deleteBadge}
                        >
                          <Text style={styles.deleteBadgeText}>Hapus</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'participants' ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tambah Peserta Kelas</Text>

                {registeredStudentsHint.length > 0 ? (
                  <View style={styles.studentQuickPick}>
                    <Text style={styles.quickPickLabel}>
                      Pilih dari akun praktikan terdaftar:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickPickRow}
                    >
                      {registeredStudentsHint.map((std) => (
                        <Pressable
                          key={std.id}
                          onPress={() => {
                            setStudentIdInput(std.id);
                            setStudentNameInput(std.name);
                            setStudentNimInput(std.nim ?? '');
                            if (std.className) {
                              setSelectedClassId(std.className);
                            }
                          }}
                          style={styles.quickPickChip}
                        >
                          <Text style={styles.quickPickChipText}>
                            {std.name} ({std.nim ?? std.id.slice(0, 6)})
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <Text style={styles.label}>Kelas</Text>
                <TextInput
                  value={selectedClassId}
                  onChangeText={setSelectedClassId}
                  placeholder="K-01"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />

                <Text style={styles.label}>UID / ID Praktikan</Text>
                <TextInput
                  value={studentIdInput}
                  onChangeText={setStudentIdInput}
                  placeholder="UID akun praktikan"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Text style={styles.label}>Nama Praktikan</Text>
                <TextInput
                  value={studentNameInput}
                  onChangeText={setStudentNameInput}
                  placeholder="Nama lengkap praktikan"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />

                <Text style={styles.label}>NIM (Opsional)</Text>
                <TextInput
                  value={studentNimInput}
                  onChangeText={setStudentNimInput}
                  placeholder="13523xxx"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />

                <Pressable
                  onPress={handleAddParticipant}
                  disabled={busy}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Simpan Peserta</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Peserta Terdaftar</Text>
                {participants.length === 0 ? (
                  <Text style={styles.emptyText}>Belum ada peserta kelas.</Text>
                ) : (
                  <View style={styles.itemList}>
                    {participants.map((p) => {
                      const docId = `${p.classId}_${p.studentId}`;
                      return (
                        <View key={docId} style={styles.itemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>
                              {p.studentName}
                            </Text>
                            <Text style={styles.itemSub}>
                              Kelas {p.classId} • NIM {p.nim ?? p.studentId}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => removeParticipant(docId)}
                            style={styles.deleteBadge}
                          >
                            <Text style={styles.deleteBadgeText}>Hapus</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          ) : null}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  guardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  feedbackBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  feedbackText: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  itemList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBadgeText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  studentQuickPick: {
    marginBottom: 12,
  },
  quickPickLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  quickPickRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickPickChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  quickPickChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
});
