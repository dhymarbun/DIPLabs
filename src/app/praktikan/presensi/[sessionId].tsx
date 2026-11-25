import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAttendance } from '../../../context/AttendanceContext';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge } from '../../../components/asisten/StatusBadge';
import { formatIndonesianDate } from '../../../components/asisten/SessionCard';
import { formatCheckInTime } from '../riwayat';
import { validateLocation } from '../../../services/location';
import { Laboratory, LocationCheckResult } from '../../../types/location';

export default function LocationAttendanceScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { authUser } = useAuth();
  const { sessions, laboratories, recordAttendance, getAttendanceForStudent } = useAttendance();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<LocationCheckResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const session = sessions.find((item) => item.id === sessionId);
  const laboratory = useMemo<Laboratory | undefined>(() => session && laboratories.find((lab) =>
    (session.labId && lab.id === session.labId) || lab.room.toLowerCase() === (session.room ?? '').toLowerCase() || lab.name.toLowerCase() === (session.room ?? '').toLowerCase()), [laboratories, session]);
  const record = authUser ? getAttendanceForStudent(authUser.uid).find((item) => item.sessionId === sessionId) : undefined;

  useEffect(() => { navigation.setOptions({ title: 'Presensi Berbasis Lokasi', headerShown: false }); }, [navigation]);

  const checkLocation = async () => {
    setChecking(true); setFeedback(null);
    const locationResult = await validateLocation(laboratory);
    setResult(locationResult);
    if (locationResult.ok && session?.status === 'open' && authUser && !record) {
      const attendance = await recordAttendance(session.id, authUser.uid);
      setFeedback(attendance.ok ? `Presensi berhasil dicatat pada ${formatCheckInTime(attendance.record.checkedInAt)}.` : `Presensi gagal: ${attendance.reason}.`);
    } else if (!locationResult.ok) setFeedback(locationResult.message);
    else if (record) setFeedback('Anda sudah presensi pada sesi ini.');
    else if (session?.status !== 'open') setFeedback('Sesi belum dibuka atau sudah ditutup.');
    setChecking(false);
  };

  if (!session) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text>Sesi tidak ditemukan.</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={() => router.back()} style={styles.topBack}><Text style={styles.backText}>‹  Kembali</Text></Pressable><Text style={styles.screenTitle}>Presensi</Text><View style={styles.card}>
    <View style={styles.row}><Text style={styles.className}>{session.className}</Text><StatusBadge status={session.status} /></View>
    <Text style={styles.title}>{session.practicalName}</Text>
    <Text style={styles.meta}>{formatIndonesianDate(session.date)} · {session.startTime}–{session.endTime} WIB</Text>
    <Text style={styles.meta}>Lokasi: {laboratory?.name ?? session.room ?? 'Belum ditentukan'}</Text>
    {laboratory ? <Text style={styles.meta}>Radius presensi: {laboratory.radiusMeters} m</Text> : null}
  </View><View style={styles.card}>
    <Text style={styles.heading}>Pemeriksaan lokasi</Text>
    <Text style={styles.help}>{result?.ok ? `Dalam radius (${Math.round(result.distanceMeters)} m dari lokasi).` : result?.message ?? 'Tekan tombol untuk memeriksa lokasi perangkat.'}</Text>
    {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    <Pressable disabled={checking || !!record || session.status !== 'open'} onPress={checkLocation} style={[styles.button, (checking || !!record || session.status !== 'open') && styles.disabled]}><Text style={styles.buttonText}>{checking ? 'Memeriksa lokasi...' : record ? 'Sudah presensi' : 'Periksa lokasi & presensi'}</Text></Pressable>
    <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Kembali ke detail sesi</Text></Pressable>
  </View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F2F1ED' }, content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 16 }, topBack: { paddingVertical: 8 }, screenTitle: { color: '#232420', fontSize: 32, lineHeight: 38, fontWeight: '500' }, card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, gap: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, className: { color: '#5E5F58', fontWeight: '600', fontSize: 13 }, title: { fontSize: 22, fontWeight: '600', color: '#232420' }, meta: { color: '#5E5F58', fontSize: 13, lineHeight: 19 }, heading: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#232420' }, help: { color: '#5E5F58', lineHeight: 20 }, feedback: { color: '#3E5B28', fontWeight: '600', backgroundColor: '#E5EDDA', padding: 12, borderRadius: 16 }, button: { backgroundColor: '#FFC332', padding: 15, borderRadius: 999, alignItems: 'center' }, disabled: { backgroundColor: '#D8D8D0' }, buttonText: { color: '#232420', fontWeight: '600', fontSize: 15 }, back: { alignItems: 'center', padding: 8 }, backText: { color: '#5E5F58', fontWeight: '600' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
