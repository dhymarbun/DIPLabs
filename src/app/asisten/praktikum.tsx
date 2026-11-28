import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { PracticumClass, PracticumSession } from '../../types/attendance';
import { normalizeClassName } from '../../utils/classNames';
import { Laboratory } from '../../types/notification';
import { requestLocation } from '../../services/location';
import { colors } from '../../theme/tokens';

type TabKey = 'sessions' | 'classes' | 'participants' | 'laboratories';
type FeedbackTone = 'error' | 'success' | 'info';
type FeedbackEntry = { message: string; tone: FeedbackTone; };

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function formatISODate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getCalendarCells(year: number, monthIndex: number): (number | null)[] {
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function shiftTime(value: string, offsetMinutes: number): string {
  return minutesToTime(timeToMinutes(value) + offsetMinutes);
}

export default function ManagePracticumScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { authUser } = useAuth();
  const {
    sessions, classes, participants, students, addSession, updateSession,
    deleteSession, addClass, deleteClass, addParticipant, removeParticipant,
    addLaboratory, updateLaboratory, deleteLaboratory, laboratories,
    laboratoriesLoading, mergingClasses, classMergeError, mergeDuplicateClasses,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<TabKey>('sessions');
  const [busy, setBusy] = useState<boolean>(false);
  const [feedbackByTab, setFeedbackByTab] = useState<Record<TabKey, FeedbackEntry | null>>({
    sessions: null, classes: null, participants: null, laboratories: null,
  });

  const showFeedback = (tab: TabKey, message: string, tone: FeedbackTone = 'error') => {
    setFeedbackByTab((prev) => ({ ...prev, [tab]: { message, tone } }));
  };

  const clearFeedback = (tab: TabKey) => {
    setFeedbackByTab((prev) => ({ ...prev, [tab]: null }));
  };

  const clearAllFeedback = () => {
    setFeedbackByTab({ sessions: null, classes: null, participants: null, laboratories: null });
  };

  const handleTabChange = (tab: TabKey) => {
    clearAllFeedback();
    setActiveTab(tab);
  };

  // Session form state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [practicalName, setPracticalName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [classPickerTarget, setClassPickerTarget] = useState<'session' | 'participant' | 'laboratory' | null>(null);
  const [date, setDate] = useState<string>(() => getTodayDateString());
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [room, setRoom] = useState<string>('Lab Dasar 2');
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Date & Time Picker modal state
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempHour, setTempHour] = useState<string>('08');
  const [tempMinute, setTempMinute] = useState<string>('00');

  const openDatePicker = () => {
    if (isValidISODate(date)) {
      const [y, m] = date.split('-').map(Number);
      setCalendarYear(y);
      setCalendarMonth(m - 1);
    } else {
      const now = new Date();
      setCalendarYear(now.getFullYear());
      setCalendarMonth(now.getMonth());
    }
    setDatePickerOpen(true);
  };

  const shiftCalendarMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonth + delta, 1);
    setCalendarYear(next.getFullYear());
    setCalendarMonth(next.getMonth());
  };

  const openTimePicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? startTime : endTime;
    if (TIME_PATTERN.test(current)) {
      const [h, m] = current.split(':');
      setTempHour(h);
      setTempMinute(m);
    } else {
      const now = new Date();
      setTempHour(String(now.getHours()).padStart(2, '0'));
      setTempMinute(String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'));
    }
    setTimePickerTarget(target);
  };

  const confirmTimePicker = (hourStr: string, minuteStr: string) => {
    const formatted = `${hourStr}:${minuteStr}`;
    if (timePickerTarget === 'start') {
      handleStartTimeChange(formatted);
    } else if (timePickerTarget === 'end') {
      handleEndTimeChange(formatted);
    }
    setTimePickerTarget(null);
  };

  const applyCurrentTimeNow = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const formatted = `${h}:${m}`;
    if (timePickerTarget === 'start') {
      handleStartTimeChange(formatted);
    } else if (timePickerTarget === 'end') {
      handleEndTimeChange(formatted);
    }
    setTimePickerTarget(null);
  };

  // Class form state
  const [newClassName, setNewClassName] = useState<string>('');

  // Participant form state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentNimInput, setStudentNimInput] = useState<string>('');

  // Laboratory form state
  const [labModalVisible, setLabModalVisible] = useState<boolean>(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [labName, setLabName] = useState('');
  const [labRoom, setLabRoom] = useState('');
  const [labLatitude, setLabLatitude] = useState('');
  const [labLongitude, setLabLongitude] = useState('');
  const [labRadius, setLabRadius] = useState('50');
  const [locatingLab, setLocatingLab] = useState(false);
  const [labLocationMessage, setLabLocationMessage] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.name === className || c.id === className) ?? null;
  const selectedParticipantClass = classes.find((c) => c.name === selectedClassId) ?? null;
  const selectedLab = laboratories.find((l) => l.id === selectedLabId) ?? null;

  const handleUseCurrentLocation = async () => {
    setLocatingLab(true);
    setLabLocationMessage(null);
    try {
      const coords = await requestLocation();
      setLabLatitude(coords.latitude.toFixed(6));
      setLabLongitude(coords.longitude.toFixed(6));
      setLabLocationMessage('Koordinat berhasil diambil dari GPS perangkat.');
    } catch (err) {
      const code = err instanceof Error ? err.message : 'location-unavailable';
      if (code === 'permission-denied') {
        setLabLocationMessage('Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan HP.');
      } else if (code === 'location-disabled') {
        setLabLocationMessage('Layanan lokasi (GPS) perangkat sedang mati.');
      } else {
        setLabLocationMessage('Lokasi perangkat belum tersedia. Coba lagi atau isi manual.');
      }
    } finally {
      setLocatingLab(false);
    }
  };

  const openLabModal = (laboratoryId: string | null) => {
    setEditingLabId(laboratoryId);
    const laboratory = laboratories.find((item) => item.id === laboratoryId);
    setLabName(laboratory?.name ?? '');
    setLabRoom(laboratory?.room ?? '');
    setLabLatitude(laboratory ? String(laboratory.latitude) : '');
    setLabLongitude(laboratory ? String(laboratory.longitude) : '');
    setLabRadius(laboratory ? String(laboratory.radiusMeters) : '50');
    setLabLocationMessage(null);
    setLabModalVisible(true);
    if (!laboratory) {
      void handleUseCurrentLocation();
    }
  };

  const saveLaboratory = async () => {
    const latitude = Number(labLatitude);
    const longitude = Number(labLongitude);
    const radiusMeters = Number(labRadius);
    if (!labName.trim() || !labRoom.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      showFeedback('laboratories', 'Nama, ruangan, koordinat, dan radius harus valid.');
      return;
    }
    setBusy(true);
    try {
      if (editingLabId) await updateLaboratory(editingLabId, { name: labName.trim(), room: labRoom.trim(), latitude, longitude, radiusMeters });
      else await addLaboratory({ name: labName.trim(), room: labRoom.trim(), latitude, longitude, radiusMeters });
      setLabModalVisible(false);
      showFeedback('laboratories', 'Laboratorium berhasil disimpan.', 'success');
    } catch (error) {
      showFeedback('laboratories', error instanceof Error ? error.message : 'Gagal menyimpan laboratorium.');
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (editingSessionId) return;
    if (classes.length === 0) { setClassName(''); return; }
    const hasSelection = classes.some((c) => c.name === className || c.id === className);
    if (!hasSelection) setClassName(classes[0].name);
  }, [classes, className, editingSessionId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const stillExists = classes.some((c) => c.name === selectedClassId);
    if (!stillExists) setSelectedClassId('');
  }, [classes, selectedClassId]);

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setPracticalName('');
    setClassName(classes[0]?.name ?? '');
    setDate(getTodayDateString());
    setStartTime('08:00');
    setEndTime('10:00');
    setRoom('Lab Dasar 2');
    setSelectedLabId(null);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    const trimmed = value.trim();
    if (TIME_PATTERN.test(trimmed)) setEndTime(shiftTime(trimmed, 120));
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    const trimmed = value.trim();
    if (TIME_PATTERN.test(trimmed)) setStartTime(shiftTime(trimmed, -120));
  };

  const handleEditSession = (s: PracticumSession) => {
    setEditingSessionId(s.id);
    setPracticalName(s.practicalName);
    setClassName(s.className);
    setDate(s.date);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setRoom(s.room ?? '');
    setSelectedLabId(s.labId ?? laboratories.find((lab) => lab.room === s.room)?.id ?? null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSaveSession = async () => {
    const nextPracticalName = practicalName.trim();
    const nextClassName = className.trim();
    const nextDate = date.trim();
    const nextStartTime = startTime.trim();
    const nextEndTime = endTime.trim();
    const nextRoom = room.trim();

    if (!nextPracticalName || !nextClassName || !nextDate || !nextStartTime || !nextEndTime || !nextRoom || !selectedLabId) {
      showFeedback('sessions', 'Nama praktikum, kelas, tanggal, jam mulai, jam selesai, dan ruangan wajib diisi.');
      return;
    }
    if (!isValidISODate(nextDate)) {
      showFeedback('sessions', 'Format tanggal harus YYYY-MM-DD dan tanggal harus valid.');
      return;
    }
    if (nextDate < getTodayDateString()) { showFeedback('sessions', 'Tanggal sesi tidak boleh sebelum hari ini.'); return; }
    if (!TIME_PATTERN.test(nextStartTime) || !TIME_PATTERN.test(nextEndTime)) {
      showFeedback('sessions', 'Format jam harus HH:mm, contoh 08:00 dan 10:00.');
      return;
    }
    const durationMinutes = (timeToMinutes(nextEndTime) - timeToMinutes(nextStartTime) + 1440) % 1440;
    if (durationMinutes !== 120) {
      showFeedback('sessions', 'Durasi sesi harus tepat 2 jam, contoh 08:00\u201310:00.');
      return;
    }
    const classDoc = classes.find((c) => c.id === nextClassName || c.name === nextClassName);
    if (!classDoc) {
      showFeedback('sessions', 'Kelas harus dipilih dari daftar kelas yang tersedia.');
      return;
    }
    const canonicalClassName = classDoc.name;

    setBusy(true);
    clearFeedback('sessions');
    try {
      const classParticipants = participants.filter((p) => p.classId === classDoc.id || p.classId === classDoc.name).map((p) => p.studentId);
      if (editingSessionId) {
        const existingSession = sessions.find((item) => item.id === editingSessionId);
        const scheduleChanged =
          existingSession &&
          (existingSession.date !== nextDate ||
            existingSession.startTime !== nextStartTime ||
            existingSession.endTime !== nextEndTime);
        const shouldResetStatus = existingSession?.status === 'closed' && scheduleChanged;
        await updateSession(editingSessionId, {
          practicalName: nextPracticalName,
          className: canonicalClassName,
          date: nextDate,
          startTime: nextStartTime,
          endTime: nextEndTime,
          room: selectedLab?.room ?? nextRoom,
          labId: selectedLabId ?? undefined,
          participantIds: classParticipants,
          ...(shouldResetStatus ? { status: 'upcoming' as const } : {}),
        });
        showFeedback('sessions', 'Sesi berhasil diperbarui.', 'success');
      } else {
        await addSession({ practicalName: nextPracticalName, className: canonicalClassName, date: nextDate, startTime: nextStartTime, endTime: nextEndTime, room: selectedLab?.room ?? nextRoom, labId: selectedLabId ?? undefined, assistantId: authUser?.uid, assistantName: authUser?.name, participantIds: classParticipants });
        showFeedback('sessions', 'Sesi baru berhasil ditambahkan.', 'success');
      }
      resetSessionForm();
    } catch (err) {
      showFeedback('sessions', err instanceof Error ? err.message : 'Gagal menyimpan data sesi.');
    } finally { setBusy(false); }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setBusy(true);
    clearFeedback('sessions');
    try {
      await deleteSession(sessionId);
      showFeedback('sessions', 'Sesi berhasil dihapus.', 'success');
    } catch (err) {
      showFeedback('sessions', err instanceof Error ? err.message : 'Gagal menghapus sesi.');
    } finally { setBusy(false); }
  };

  const handleAddClass = async () => {
    const normalizedClassName = newClassName.trim();
    if (!normalizedClassName) { showFeedback('classes', 'Nama kelas wajib diisi.'); return; }
    const classNameKey = normalizeClassName(normalizedClassName);
    const isDuplicate = classes.some((c) => normalizeClassName(c.name) === classNameKey);
    if (isDuplicate) { showFeedback('classes', 'Nama kelas sudah ada.'); return; }
    setBusy(true);
    clearFeedback('classes');
    try {
      await addClass({ name: normalizedClassName, assistantIds: authUser ? [authUser.uid] : [] });
      setNewClassName('');
      showFeedback('classes', 'Kelas baru berhasil ditambahkan.', 'success');
    } catch (err) {
      showFeedback('classes', err instanceof Error ? err.message : 'Gagal menambahkan kelas.');
    } finally { setBusy(false); }
  };

  const handleDeleteClass = async (classDoc: PracticumClass) => {
    const classKey = normalizeClassName(classDoc.name);
    const isUsedBySession = sessions.some((s) => s.className === classDoc.id || normalizeClassName(s.className) === classKey);
    if (isUsedBySession) { showFeedback('classes', `Kelas ${classDoc.name} tidak bisa dihapus karena masih dipakai sesi.`); return; }
    setBusy(true);
    clearFeedback('classes');
    try {
      await deleteClass(classDoc.id);
      showFeedback('classes', `Kelas ${classDoc.name} berhasil dihapus.`, 'success');
    } catch (err) {
      showFeedback('classes', err instanceof Error ? err.message : 'Gagal menghapus kelas.');
    } finally { setBusy(false); }
  };

  const handleRetryMergeClasses = async () => {
    clearFeedback('classes');
    try {
      const summary = await mergeDuplicateClasses();
      showFeedback('classes', summary.removedClasses > 0 ? `Penggabungan selesai: ${summary.removedClasses} kelas duplikat dihapus.` : 'Tidak ada kelas duplikat untuk digabungkan.', summary.removedClasses > 0 ? 'success' : 'info');
    } catch (err) {
      showFeedback('classes', err instanceof Error ? err.message : 'Gagal menggabungkan kelas duplikat.');
    }
  };

  const handleAddParticipant = async () => {
    const sName = studentNameInput.trim();
    const nim = studentNimInput.trim();
    if (!selectedParticipantClass) { showFeedback('participants', 'Kelas harus dipilih dari daftar kelas yang tersedia.'); return; }
    if (!/^\d{8,12}$/.test(nim)) { showFeedback('participants', 'NIM wajib diisi dan harus berupa 8\u201312 digit angka.'); return; }
    const matches = students.filter((s) => (s.nim ?? '').trim() === nim);
    if (matches.length === 0) { showFeedback('participants', 'NIM belum terdaftar sebagai akun praktikan. Pastikan praktikan sudah registrasi.'); return; }
    if (matches.length > 1) { showFeedback('participants', 'NIM terdaftar pada lebih dari satu akun. Hubungi administrator.'); return; }
    const account = matches[0];
    const resolvedName = sName || account.name;
    if (!resolvedName) { showFeedback('participants', 'Nama praktikan wajib diisi.'); return; }
    setBusy(true);
    clearFeedback('participants');
    try {
      await addParticipant({ classId: selectedParticipantClass.name, studentId: account.id, studentName: resolvedName, nim });
      setStudentNameInput('');
      setStudentNimInput('');
      showFeedback('participants', 'Peserta berhasil ditambahkan ke kelas.', 'success');
    } catch (err) {
      showFeedback('participants', err instanceof Error ? err.message : 'Gagal menambahkan peserta.');
    } finally { setBusy(false); }
  };

  const registeredStudentsHint = useMemo(() => students.filter((s) => (s.nim ?? '').trim().length > 0).slice(0, 8), [students]);

  if (!authUser || authUser.role !== 'asisten') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.guardTitle}>Akses Khusus Asisten</Text>
          <Pressable onPress={() => router.replace('/auth/login')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Masuk</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.tabsRow}>
            <Pressable onPress={() => handleTabChange('sessions')} style={[styles.tabBtn, activeTab === 'sessions' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>Jadwal & Sesi ({sessions.length})</Text>
            </Pressable>
            <Pressable onPress={() => handleTabChange('classes')} style={[styles.tabBtn, activeTab === 'classes' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === 'classes' && styles.tabTextActive]}>Kelas ({classes.length})</Text>
            </Pressable>
            <Pressable onPress={() => handleTabChange('participants')} style={[styles.tabBtn, activeTab === 'participants' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>Peserta ({participants.length})</Text>
            </Pressable>
            <Pressable onPress={() => handleTabChange('laboratories')} style={[styles.tabBtn, activeTab === 'laboratories' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === 'laboratories' && styles.tabTextActive]}>Laboratorium</Text>
            </Pressable>
          </View>

          {activeTab === 'sessions' ? (
            <>
              {feedbackByTab.sessions ? (
                <View style={[styles.feedbackBox, feedbackByTab.sessions.tone === 'error' && styles.feedbackErrorBox]}>
                  <Text style={[styles.feedbackText, feedbackByTab.sessions.tone === 'error' && styles.feedbackErrorText]}>{feedbackByTab.sessions.message}</Text>
                </View>
              ) : null}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{editingSessionId ? 'Ubah Sesi Praktikum' : 'Tambah Sesi Baru'}</Text>
                <Text style={styles.label}>Nama Modul / Praktikum<Text style={styles.requiredMark}> *</Text></Text>
                <TextInput value={practicalName} onChangeText={setPracticalName} placeholder="Contoh: Modul 3: Segmentasi Citra" placeholderTextColor="#94A3B8" style={styles.input} />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Kelas<Text style={styles.requiredMark}> *</Text></Text>
                    <Pressable onPress={() => setClassPickerTarget('session')} style={styles.classSelect}>
                      <Text style={[styles.classSelectText, !selectedClass && styles.classSelectPlaceholder]}>{selectedClass?.name ?? 'Pilih kelas'}</Text>
                      <Text style={styles.classSelectAction}>{selectedClass ? 'Ganti' : 'Pilih'}</Text>
                    </Pressable>
                    {classes.length === 0 ? <Text style={styles.classWarning}>Belum ada kelas. Tambahkan kelas di tab Kelas.</Text> : editingSessionId && className && !selectedClass ? <Text style={styles.classError}>Kelas sesi ini tidak lagi tersedia. Pilih kelas lain.</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Tanggal<Text style={styles.requiredMark}> *</Text></Text>
                    <Pressable onPress={openDatePicker} style={styles.classSelect}>
                      <Text style={[styles.classSelectText, !date && styles.classSelectPlaceholder]}>{date || 'Pilih tanggal'}</Text>
                      <Text style={styles.classSelectAction}>Pilih</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Jam Mulai<Text style={styles.requiredMark}> *</Text></Text>
                    <Pressable onPress={() => openTimePicker('start')} style={styles.classSelect}>
                      <Text style={[styles.classSelectText, !startTime && styles.classSelectPlaceholder]}>{startTime || '08:00'}</Text>
                      <Text style={styles.classSelectAction}>Pilih</Text>
                    </Pressable>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Jam Selesai<Text style={styles.requiredMark}> *</Text></Text>
                    <Pressable onPress={() => openTimePicker('end')} style={styles.classSelect}>
                      <Text style={[styles.classSelectText, !endTime && styles.classSelectPlaceholder]}>{endTime || '10:00'}</Text>
                      <Text style={styles.classSelectAction}>Pilih</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.label}>Ruangan<Text style={styles.requiredMark}> *</Text></Text>
                <TextInput value={room} onChangeText={setRoom} placeholder="Lab Dasar 2" placeholderTextColor="#94A3B8" style={styles.input} />
                <Text style={styles.label}>Laboratorium<Text style={styles.requiredMark}> *</Text></Text>
                <Pressable onPress={() => setClassPickerTarget('laboratory')} style={styles.classSelect}>
                  <Text style={[styles.classSelectText, !selectedLab && styles.classSelectPlaceholder]}>{selectedLab?.name ?? 'Pilih laboratorium'}</Text>
                  <Text style={styles.classSelectAction}>{selectedLab ? 'Ganti' : 'Pilih'}</Text>
                </Pressable>
                {laboratories.length === 0 ? <Text style={styles.classWarning}>Belum ada laboratorium. Tambahkan laboratorium di tab Laboratorium.</Text> : null}
                <View style={styles.formActionRow}>
                  {editingSessionId ? <Pressable onPress={resetSessionForm} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Batal</Text></Pressable> : null}
                  <Pressable onPress={handleSaveSession} disabled={busy} style={[styles.primaryBtn, { flex: 1 }]}>
                    {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryBtnText}>{editingSessionId ? 'Simpan Perubahan' : 'Tambah Sesi'}</Text>}
                  </Pressable>
                </View>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Sesi</Text>
                {sessions.length === 0 ? <Text style={styles.emptyText}>Belum ada sesi terdaftar.</Text> : (
                  <View style={styles.itemList}>{sessions.map((s) => (
                    <View key={s.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{s.practicalName}</Text>
                        <Text style={styles.itemSub}>{s.className} \u2022 {s.date} ({s.startTime}\u2013{s.endTime})</Text>
                      </View>
                      <View style={styles.itemActions}>
                        <Pressable onPress={() => handleEditSession(s)} style={styles.editBadge}><Text style={styles.editBadgeText}>Ubah</Text></Pressable>
                        <Pressable onPress={() => handleDeleteSession(s.id)} style={styles.deleteBadge}><Text style={styles.deleteBadgeText}>Hapus</Text></Pressable>
                      </View>
                    </View>
                  ))}</View>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'classes' ? (
            <>
              {feedbackByTab.classes ? (
                <View style={[styles.feedbackBox, feedbackByTab.classes.tone === 'error' && styles.feedbackErrorBox]}>
                  <Text style={[styles.feedbackText, feedbackByTab.classes.tone === 'error' && styles.feedbackErrorText]}>{feedbackByTab.classes.message}</Text>
                </View>
              ) : null}
              {mergingClasses ? <View style={styles.feedbackBox}><Text style={styles.feedbackText}>Merapikan kelas duplikat...</Text></View> : null}
              {classMergeError ? (
                <View style={[styles.feedbackBox, styles.feedbackErrorBox]}>
                  <Text style={[styles.feedbackText, styles.feedbackErrorText]}>{classMergeError}</Text>
                  <Pressable onPress={handleRetryMergeClasses} disabled={busy || mergingClasses} style={[styles.primaryBtn, { marginTop: 8 }]}><Text style={styles.primaryBtnText}>Coba Lagi</Text></Pressable>
                </View>
              ) : null}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tambah Kelas Praktikum</Text>
                <Text style={styles.label}>Nama Kelas<Text style={styles.requiredMark}> *</Text></Text>
                <TextInput value={newClassName} onChangeText={setNewClassName} placeholder="Contoh: K-03" placeholderTextColor="#94A3B8" style={styles.input} />
                <Pressable onPress={handleAddClass} disabled={busy || mergingClasses} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Tambah Kelas</Text></Pressable>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Kelas</Text>
                {classes.length === 0 ? <Text style={styles.emptyText}>Belum ada data kelas.</Text> : (
                  <View style={styles.itemList}>{classes.map((c) => (
                    <View key={c.id} style={styles.itemRow}>
                      <Text style={styles.itemTitle}>Kelas {c.name}</Text>
                      <Pressable onPress={() => handleDeleteClass(c)} style={styles.deleteBadge}><Text style={styles.deleteBadgeText}>Hapus</Text></Pressable>
                    </View>
                  ))}</View>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'participants' ? (
            <>
              {feedbackByTab.participants ? (
                <View style={[styles.feedbackBox, feedbackByTab.participants.tone === 'error' && styles.feedbackErrorBox]}>
                  <Text style={[styles.feedbackText, feedbackByTab.participants.tone === 'error' && styles.feedbackErrorText]}>{feedbackByTab.participants.message}</Text>
                </View>
              ) : null}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tambah Peserta Kelas</Text>
                {registeredStudentsHint.length > 0 ? (
                  <View style={styles.studentQuickPick}>
                    <Text style={styles.quickPickLabel}>Pilih dari akun praktikan terdaftar:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPickRow}>
                      {registeredStudentsHint.map((std) => (
                        <Pressable key={std.id} onPress={() => {
                          setStudentNameInput(std.name);
                          setStudentNimInput(std.nim ?? '');
                          const studentClassName = std.className;
                          if (studentClassName) {
                            const matchedClass = classes.find((c) => normalizeClassName(c.name) === normalizeClassName(studentClassName));
                            if (matchedClass) setSelectedClassId(matchedClass.name);
                            else showFeedback('participants', `Kelas ${studentClassName} milik ${std.name} belum terdaftar. Pilih kelas yang tersedia.`);
                          }
                        }} style={styles.quickPickChip}>
                          <Text style={styles.quickPickChipText}>{std.name} ({std.nim ?? std.id.slice(0, 6)})</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
                <Text style={styles.label}>Kelas<Text style={styles.requiredMark}> *</Text></Text>
                <Pressable onPress={() => setClassPickerTarget('participant')} style={styles.classSelect}>
                  <Text style={[styles.classSelectText, !selectedParticipantClass && styles.classSelectPlaceholder]}>{selectedParticipantClass?.name ?? 'Pilih kelas'}</Text>
                  <Text style={styles.classSelectAction}>{selectedParticipantClass ? 'Ganti' : 'Pilih'}</Text>
                </Pressable>
                {classes.length === 0 ? <Text style={styles.classWarning}>Belum ada kelas. Tambahkan kelas di tab Kelas.</Text> : null}
                <Text style={styles.label}>Nama Praktikan</Text>
                <TextInput value={studentNameInput} onChangeText={setStudentNameInput} placeholder="Nama lengkap praktikan" placeholderTextColor="#94A3B8" style={styles.input} />
                <Text style={styles.label}>NIM<Text style={styles.requiredMark}> *</Text></Text>
                <TextInput value={studentNimInput} onChangeText={setStudentNimInput} placeholder="13523005" placeholderTextColor="#94A3B8" keyboardType="number-pad" maxLength={12} style={styles.input} />
                <Text style={styles.inputHint}>NIM harus terdaftar sebagai akun praktikan.</Text>
                <Pressable onPress={handleAddParticipant} disabled={busy || classes.length === 0} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Simpan Peserta</Text></Pressable>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daftar Peserta Terdaftar</Text>
                {participants.length === 0 ? <Text style={styles.emptyText}>Belum ada peserta kelas.</Text> : (
                  <View style={styles.itemList}>{participants.map((p) => {
                    const docId = `${p.classId}_${p.studentId}`;
                    return (
                      <View key={docId} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{p.studentName}</Text>
                          <Text style={styles.itemSub}>Kelas {p.classId} \u2022 NIM {p.nim ?? '-'}</Text>
                        </View>
                        <Pressable onPress={() => removeParticipant(docId)} style={styles.deleteBadge}><Text style={styles.deleteBadgeText}>Hapus</Text></Pressable>
                      </View>
                    );
                  })}</View>
                )}
              </View>
            </>
          ) : null}

          {activeTab === 'laboratories' ? (
            <>
              {feedbackByTab.laboratories ? (
                <View style={[styles.feedbackBox, feedbackByTab.laboratories.tone === 'error' && styles.feedbackErrorBox]}>
                  <Text style={[styles.feedbackText, feedbackByTab.laboratories.tone === 'error' && styles.feedbackErrorText]}>{feedbackByTab.laboratories.message}</Text>
                </View>
              ) : null}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Kelola Laboratorium</Text>
                <Pressable onPress={() => openLabModal(null)} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Tambah Laboratorium</Text>
                </Pressable>
              </View>
              {laboratoriesLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={[styles.emptySubtitle, { marginTop: 8 }]}>Memuat data laboratorium...</Text>
                </View>
              ) : laboratories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Belum ada laboratorium</Text>
                  <Text style={styles.emptySubtitle}>Tambahkan laboratorium terlebih dahulu agar dapat dipilih saat membuat sesi.</Text>
                </View>
              ) : (
                <View style={styles.itemList}>
                  {laboratories.map((lab) => (
                    <View key={lab.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{lab.name}</Text>
                        <Text style={styles.itemSub}>{lab.room} \u2022 Radius {lab.radiusMeters} m</Text>
                        <Text style={styles.itemSub}>{lab.latitude}, {lab.longitude}</Text>
                      </View>
                      <View style={styles.itemActions}>
                        <Pressable onPress={() => openLabModal(lab.id)} style={styles.editBadge}><Text style={styles.editBadgeText}>Edit</Text></Pressable>
                        <Pressable onPress={() => deleteLaboratory(lab.id)} style={styles.deleteBadge}><Text style={styles.deleteBadgeText}>Hapus</Text></Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={classPickerTarget !== null} transparent animationType="fade" onRequestClose={() => setClassPickerTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{classPickerTarget === 'participant' ? 'Pilih Kelas Peserta' : classPickerTarget === 'laboratory' ? 'Pilih Laboratorium' : 'Pilih Kelas Sesi'}</Text>
            {classPickerTarget === 'laboratory' ? (
              <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                {laboratories.map((lab) => (
                  <Pressable key={lab.id} onPress={() => { setSelectedLabId(lab.id); setRoom(lab.room); setClassPickerTarget(null); }} style={[styles.modalOption, selectedLabId === lab.id && styles.modalOptionActive]}>
                    <Text style={styles.modalOptionText}>{lab.name} ({lab.room})</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : classes.length === 0 ? <Text style={styles.emptyText}>Belum ada kelas. Tambahkan kelas terlebih dahulu.</Text> : (
              <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                {classes.map((c) => {
                  const isSelected = classPickerTarget === 'participant' ? selectedParticipantClass?.id === c.id : selectedClass?.id === c.id || className === c.name;
                  return (
                    <Pressable key={c.id} onPress={() => {
                      if (classPickerTarget === 'participant') setSelectedClassId(c.name);
                      else setClassName(c.name);
                      setClassPickerTarget(null);
                    }} style={[styles.modalOption, isSelected && styles.modalOptionActive]}>
                      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>{c.name}</Text>
                      {isSelected ? <Text style={styles.modalOptionMark}>Dipilih</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {classes.length === 0 ? (
              <Pressable onPress={() => { setClassPickerTarget(null); handleTabChange('classes'); }} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Buka Tab Kelas</Text></Pressable>
            ) : null}
            <Pressable onPress={() => setClassPickerTarget(null)} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Tutup</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={labModalVisible} transparent animationType="fade" onRequestClose={() => setLabModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingLabId ? 'Ubah Laboratorium' : 'Tambah Laboratorium'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nama Laboratorium</Text>
              <TextInput value={labName} onChangeText={setLabName} placeholder="Contoh: Laboratorium Dasar 2" style={styles.input} />
              <Text style={styles.label}>Ruangan</Text>
              <TextInput value={labRoom} onChangeText={setLabRoom} placeholder="Contoh: Lab Dasar 2" style={styles.input} />
              <Pressable
                onPress={handleUseCurrentLocation}
                disabled={locatingLab || busy}
                style={[styles.secondaryBtn, { marginBottom: 10 }]}
              >
                {locatingLab ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color={colors.ink} size="small" />
                    <Text style={styles.secondaryBtnText}>Mengambil lokasi GPS...</Text>
                  </View>
                ) : (
                  <Text style={styles.secondaryBtnText}>📍 Gunakan Lokasi HP Saat Ini</Text>
                )}
              </Pressable>
              {labLocationMessage ? (
                <Text style={styles.inputHint}>{labLocationMessage}</Text>
              ) : null}
              <Text style={styles.label}>Latitude</Text>
              <TextInput value={labLatitude} onChangeText={setLabLatitude} placeholder="Contoh: -6.9271" keyboardType="numbers-and-punctuation" style={styles.input} />
              <Text style={styles.label}>Longitude</Text>
              <TextInput value={labLongitude} onChangeText={setLabLongitude} placeholder="Contoh: 110.4182" keyboardType="numbers-and-punctuation" style={styles.input} />
              <Text style={styles.label}>Radius (meter)</Text>
              <TextInput value={labRadius} onChangeText={setLabRadius} placeholder="Contoh: 50" keyboardType="numeric" style={styles.input} />
              <View style={styles.buttonRow}>
                <Pressable onPress={() => setLabModalVisible(false)} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Batal</Text></Pressable>
                <Pressable onPress={saveLaboratory} style={[styles.primaryBtn, { flex: 1 }]} disabled={busy}>
                  {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryBtnText}>Simpan</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={datePickerOpen} transparent animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Tanggal Sesi</Text>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => shiftCalendarMonth(-1)} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>‹</Text>
              </Pressable>
              <Text style={styles.calendarMonthTitle}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
              <Pressable onPress={() => shiftCalendarMonth(1)} style={styles.calendarNavBtn}>
                <Text style={styles.calendarNavText}>›</Text>
              </Pressable>
            </View>
            <View style={styles.calendarRow}>
              {DAY_HEADERS.map((d) => (
                <Text key={d} style={styles.calendarDayHeader}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getCalendarCells(calendarYear, calendarMonth).map((dayNum, idx) => {
                if (!dayNum) {
                  return <View key={`empty-${idx}`} style={styles.calendarCell} />;
                }
                const iso = formatISODate(calendarYear, calendarMonth, dayNum);
                const todayIso = getTodayDateString();
                const isPast = iso < todayIso;
                const isSelected = iso === date;
                const isToday = iso === todayIso;
                return (
                  <Pressable
                    key={iso}
                    disabled={isPast}
                    onPress={() => {
                      setDate(iso);
                      setDatePickerOpen(false);
                    }}
                    style={[
                      styles.calendarCell,
                      isToday && styles.calendarCellToday,
                      isSelected && styles.calendarCellSelected,
                      isPast && styles.calendarCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        isSelected && styles.calendarCellTextSelected,
                        isPast && styles.calendarCellTextDisabled,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => {
                  const todayIso = getTodayDateString();
                  setDate(todayIso);
                  setDatePickerOpen(false);
                }}
                style={[styles.primaryBtn, { flex: 1 }]}
              >
                <Text style={styles.primaryBtnText}>Hari Ini</Text>
              </Pressable>
              <Pressable onPress={() => setDatePickerOpen(false)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Tutup</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={timePickerTarget !== null} transparent animationType="fade" onRequestClose={() => setTimePickerTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {timePickerTarget === 'start' ? 'Pilih Jam Mulai' : 'Pilih Jam Selesai'}
            </Text>
            <Text style={styles.inputHint}>
              Durasi otomatis disesuaikan 2 jam ({timePickerTarget === 'start' ? 'Jam Selesai' : 'Jam Mulai'} ikut berubah).
            </Text>
            <View style={styles.timeColumnsRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Jam</Text>
                <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                  {HOUR_OPTIONS.map((h) => {
                    const active = tempHour === h;
                    return (
                      <Pressable
                        key={h}
                        onPress={() => setTempHour(h)}
                        style={[styles.timeOption, active && styles.timeOptionActive]}
                      >
                        <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>{h}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Menit</Text>
                <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                  {MINUTE_OPTIONS.map((m) => {
                    const active = tempMinute === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setTempMinute(m)}
                        style={[styles.timeOption, active && styles.timeOptionActive]}
                      >
                        <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <Pressable onPress={applyCurrentTimeNow} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Sekarang</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmTimePicker(tempHour, tempMinute)}
                style={[styles.primaryBtn, { flex: 1 }]}
              >
                <Text style={styles.primaryBtnText}>Pilih ({tempHour}:{tempMinute})</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setTimePickerTarget(null)} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const legacyStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  guardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#0F172A', fontWeight: '700' },
  feedbackBox: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 10, padding: 12 },
  feedbackErrorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  feedbackText: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },
  feedbackErrorText: { color: '#DC2626' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 4 },
  requiredMark: { color: '#DC2626' },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: 12 },
  inputHint: { fontSize: 11, color: '#64748B', marginTop: -8, marginBottom: 12 },
  classSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#F8FAFC', marginBottom: 12, gap: 8 },
  classSelectText: { fontSize: 13, color: '#0F172A', flex: 1 },
  classSelectPlaceholder: { color: '#94A3B8' },
  classSelectAction: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  classWarning: { fontSize: 11, color: '#B45309', marginTop: -8, marginBottom: 12 },
  classError: { fontSize: 11, color: '#DC2626', marginTop: -8, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalList: { maxHeight: 340 },
  modalListContent: { gap: 8 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F8FAFC', gap: 8 },
  modalOptionActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  modalOptionText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  modalOptionTextActive: { color: '#1D4ED8' },
  modalOptionMark: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  row: { flexDirection: 'row', gap: 10 },
  formActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: { backgroundColor: '#2563EB', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#F1F5F9', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  secondaryBtnText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#64748B' },
  emptyState: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  itemList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9', gap: 10 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  itemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 6 },
  editBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  editBadgeText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  deleteBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  deleteBadgeText: { color: '#991B1B', fontSize: 12, fontWeight: '600' },
  studentQuickPick: { marginBottom: 12 },
  quickPickLabel: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  quickPickRow: { flexDirection: 'row', gap: 6 },
  quickPickChip: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  quickPickChipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, alignItems: 'center' },
  container: { width: '100%', maxWidth: 640, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  guardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  tabsRow: { flexDirection: 'row', backgroundColor: colors.sage, borderRadius: 20, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.card },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.ink, fontWeight: '700' },
  feedbackBox: { backgroundColor: colors.success, borderColor: colors.success, borderWidth: 1, borderRadius: 20, padding: 12 },
  feedbackErrorBox: { backgroundColor: colors.rose, borderColor: colors.rose },
  feedbackText: { fontSize: 13, color: colors.successInk, fontWeight: '600' },
  feedbackErrorText: { color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 28, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.ink, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 },
  requiredMark: { color: colors.danger },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.canvas, marginBottom: 12 },
  inputHint: { fontSize: 11, color: colors.muted, marginTop: -8, marginBottom: 12 },
  classSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.canvas, marginBottom: 12, gap: 8 },
  classSelectText: { fontSize: 13, color: colors.ink, flex: 1 },
  classSelectPlaceholder: { color: colors.muted },
  classSelectAction: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  classWarning: { fontSize: 11, color: colors.ink, marginTop: -8, marginBottom: 12 },
  classError: { fontSize: 11, color: colors.danger, marginTop: -8, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(35, 36, 32, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: colors.card, borderRadius: 28, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  modalList: { maxHeight: 340 },
  modalListContent: { gap: 8 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.canvas, gap: 8 },
  modalOptionActive: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  modalOptionText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  modalOptionTextActive: { color: colors.ink },
  modalOptionMark: { fontSize: 11, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', gap: 10 },
  formActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: { backgroundColor: colors.yellow, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  secondaryBtn: { backgroundColor: colors.sage, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center' },
  secondaryBtnText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.muted },
  emptyState: { backgroundColor: colors.card, borderRadius: 28, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  itemList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.canvas, gap: 10 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  itemSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 6 },
  editBadge: { backgroundColor: colors.yellowSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  editBadgeText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  deleteBadge: { backgroundColor: colors.rose, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  deleteBadgeText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  studentQuickPick: { marginBottom: 12 },
  quickPickLabel: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  quickPickRow: { flexDirection: 'row', gap: 6 },
  quickPickChip: { backgroundColor: colors.sage, borderWidth: 1, borderColor: colors.sage, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  quickPickChipText: { fontSize: 12, color: colors.ink, fontWeight: '500' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  calendarNavBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  calendarNavText: { fontSize: 18, fontWeight: '700', color: colors.ink },
  calendarMonthTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  calendarRow: { flexDirection: 'row', marginBottom: 4 },
  calendarDayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.muted },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  calendarCellToday: { borderWidth: 1, borderColor: colors.yellow },
  calendarCellSelected: { backgroundColor: colors.yellow },
  calendarCellDisabled: { opacity: 0.3 },
  calendarCellText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  calendarCellTextSelected: { color: colors.ink, fontWeight: '700' },
  calendarCellTextDisabled: { color: colors.muted },
  timeColumnsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  timeColumn: { flex: 1 },
  timeColumnLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textAlign: 'center', marginBottom: 6 },
  timeList: { maxHeight: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.canvas },
  timeOption: { paddingVertical: 10, alignItems: 'center', borderRadius: 12, marginHorizontal: 6, marginVertical: 2 },
  timeOptionActive: { backgroundColor: colors.yellow },
  timeOptionText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  timeOptionTextActive: { fontWeight: '700', color: colors.ink },
  timeColon: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 18 },
});
