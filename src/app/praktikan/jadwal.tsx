import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PraktikanSessionCard } from '../../components/praktikan/PraktikanSessionCard';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';

export default function PraktikanScheduleScreen() {
  const router = useRouter();
  const { authUser } = useAuth();
  const { sessions, sessionsLoading, attendanceError, getAttendanceForStudent } = useAttendance();

  const recordsBySession = useMemo(() => {
    if (!authUser) return new Set<string>();
    return new Set(getAttendanceForStudent(authUser.uid).map((record) => record.sessionId));
  }, [authUser, getAttendanceForStudent]);

  if (!authUser || authUser.role !== 'praktikan') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.state}>
          <Text style={styles.title}>Akses praktikan diperlukan</Text>
          <Text style={styles.description}>Masuk dengan akun praktikan untuk melihat jadwal Anda.</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.buttonText}>Ke halaman login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {sessionsLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.description}>Memuat jadwal praktikum...</Text>
          </View>
        ) : attendanceError ? (
          <View style={styles.state}>
            <Text style={styles.title}>Jadwal tidak dapat dimuat</Text>
            <Text style={styles.description}>{attendanceError}</Text>
            <Pressable style={styles.button} onPress={() => router.replace('/praktikan')}>
              <Text style={styles.buttonText}>Kembali dan coba lagi</Text>
            </Pressable>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.title}>Belum ada jadwal</Text>
            <Text style={styles.description}>Anda belum terdaftar pada sesi praktikum mana pun.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.heading}>Sesi Anda</Text>
            {sessions.map((session) => (
              <PraktikanSessionCard
                key={session.id}
                session={session}
                footerNote={recordsBySession.has(session.id) ? 'Sudah presensi' : undefined}
                onPress={() => router.push(`/praktikan/${session.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, padding: 16 },
  list: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  heading: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  state: { flex: 1, minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  description: { fontSize: 13, color: '#64748B', lineHeight: 19, textAlign: 'center' },
  button: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
