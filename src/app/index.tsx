import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAttendance } from '../context/AttendanceContext';
import { AppUser, UserRole } from '../types/attendance';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    assistants,
    students,
    sessions,
    attendanceRecords,
  } = useAttendance();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    currentUser?.role ?? 'asisten'
  );
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    if (currentUser) return currentUser.id;
    return assistants[0]?.id ?? '';
  });

  const userList = selectedRole === 'asisten' ? assistants : students;

  const selectedUser: AppUser | undefined = useMemo(() => {
    return (
      userList.find((u) => u.id === selectedUserId) ??
      userList[0]
    );
  }, [userList, selectedUserId]);

  const openSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'open').length,
    [sessions]
  );

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const list = role === 'asisten' ? assistants : students;
    if (list.length > 0) {
      setSelectedUserId(list[0].id);
    }
  };

  const handleContinue = () => {
    if (!selectedUser) return;
    setCurrentUser(selectedUser);
    if (selectedUser.role === 'asisten') {
      router.push('/asisten');
    } else {
      router.push('/praktikan');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hero / Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.badgeRow}>
              <View style={styles.appBadge}>
                <Text style={styles.appBadgeText}>SPRINT 1 PROTOTYPE</Text>
              </View>
              <View style={styles.runtimePill}>
                <View style={styles.runtimeDot} />
                <Text style={styles.runtimeText}>
                  {openSessionsCount} Sesi Terbuka • {attendanceRecords.length}{' '}
                  Presensi Tercatat
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Sistem Absensi Praktikum DIPLabs</Text>
            <Text style={styles.heroSubtitle}>
              Pilih peran dan identitas dummy di bawah untuk mensimulasikan alur
              pembukaan sesi, presensi praktikan, dan rekap kehadiran lintas
              peran dalam satu runtime.
            </Text>
          </View>

          {/* Active User Banner if already logged in */}
          {currentUser ? (
            <View style={styles.activeUserBanner}>
              <View style={styles.activeUserInfo}>
                <Text style={styles.activeUserLabel}>
                  Identitas Aktif Saat Ini
                </Text>
                <Text style={styles.activeUserName}>
                  {currentUser.name} ({currentUser.role.toUpperCase()})
                </Text>
                <Text style={styles.activeUserMeta}>
                  NIM {currentUser.nim ?? '-'} • Kelas{' '}
                  {currentUser.className ?? '-'}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push(
                    currentUser.role === 'asisten' ? '/asisten' : '/praktikan'
                  )
                }
                style={({ pressed }) => [
                  styles.resumeButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.resumeButtonText}>Lanjutkan →</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Step 1: Role Switcher */}
          <View style={styles.sectionCard}>
            <Text style={styles.stepLabel}>LANGKAH 1</Text>
            <Text style={styles.sectionTitle}>Pilih Peran Pengguna</Text>
            <Text style={styles.sectionHelper}>
              Ganti peran kapan saja untuk menguji interaksi antara Asisten dan
              Praktikan.
            </Text>

            <View style={styles.roleTabs}>
              <Pressable
                onPress={() => handleSelectRole('asisten')}
                style={[
                  styles.roleTab,
                  selectedRole === 'asisten' && styles.roleTabActive,
                ]}
              >
                <View style={styles.roleHeaderRow}>
                  <Text
                    style={[
                      styles.roleTabTitle,
                      selectedRole === 'asisten' && styles.roleTabTitleActive,
                    ]}
                  >
                    Asisten Praktikum
                  </Text>
                  <View
                    style={[
                      styles.countChip,
                      selectedRole === 'asisten' && styles.countChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countChipText,
                        selectedRole === 'asisten' && styles.countChipTextActive,
                      ]}
                    >
                      {assistants.length} Akun
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.roleTabDesc,
                    selectedRole === 'asisten' && styles.roleTabDescActive,
                  ]}
                >
                  Kelola jadwal, buka/tutup sesi, & pantau rekap kehadiran.
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectRole('praktikan')}
                style={[
                  styles.roleTab,
                  selectedRole === 'praktikan' && styles.roleTabActive,
                ]}
              >
                <View style={styles.roleHeaderRow}>
                  <Text
                    style={[
                      styles.roleTabTitle,
                      selectedRole === 'praktikan' && styles.roleTabTitleActive,
                    ]}
                  >
                    Praktikan
                  </Text>
                  <View
                    style={[
                      styles.countChip,
                      selectedRole === 'praktikan' && styles.countChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countChipText,
                        selectedRole === 'praktikan' &&
                          styles.countChipTextActive,
                      ]}
                    >
                      {students.length} Akun
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.roleTabDesc,
                    selectedRole === 'praktikan' && styles.roleTabDescActive,
                  ]}
                >
                  Lihat jadwal praktikum, lakukan presensi, & cek riwayat hadir.
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Step 2: Identity Selection */}
          <View style={styles.sectionCard}>
            <Text style={styles.stepLabel}>LANGKAH 2</Text>
            <Text style={styles.sectionTitle}>
              Pilih Identitas{' '}
              {selectedRole === 'asisten' ? 'Asisten' : 'Praktikan'} (Dummy)
            </Text>
            <Text style={styles.sectionHelper}>
              Pilih salah satu akun fiktif di bawah untuk masuk ke halaman{' '}
              {selectedRole === 'asisten' ? 'Asisten' : 'Praktikan'}.
            </Text>

            {userList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyBoxText}>
                  Tidak ada daftar identitas tersedia untuk peran ini.
                </Text>
              </View>
            ) : (
              <View style={styles.identityList}>
                {userList.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <Pressable
                      key={user.id}
                      onPress={() => setSelectedUserId(user.id)}
                      style={({ pressed }) => [
                        styles.identityCard,
                        isSelected && styles.identityCardSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View style={styles.radioOuter}>
                        {isSelected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <View style={styles.identityBody}>
                        <Text
                          style={[
                            styles.identityName,
                            isSelected && styles.identityNameSelected,
                          ]}
                        >
                          {user.name}
                        </Text>
                        <Text style={styles.identitySub}>
                          NIM: {user.nim ?? '-'} • Kelas:{' '}
                          {user.className ?? '-'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.rolePill,
                          user.role === 'asisten'
                            ? styles.rolePillAsisten
                            : styles.rolePillPraktikan,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            user.role === 'asisten'
                              ? styles.rolePillTextAsisten
                              : styles.rolePillTextPraktikan,
                          ]}
                        >
                          {user.role === 'asisten' ? 'Asisten' : 'Praktikan'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleContinue}
              disabled={!selectedUser}
              style={({ pressed }) => [
                styles.submitButton,
                !selectedUser && styles.submitButtonDisabled,
                pressed && selectedUser && styles.buttonPressed,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {selectedUser
                  ? `Masuk sebagai ${selectedUser.name} (${
                      selectedUser.role === 'asisten' ? 'Asisten' : 'Praktikan'
                    })`
                  : 'Pilih Identitas Terlebih Dahulu'}
              </Text>
            </Pressable>
          </View>

          {/* Quick Demo Guide Card */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Panduan Alur Demo Sprint 1</Text>
            <Text style={styles.guideStep}>
              1. Masuk sebagai Asisten → Pilih sesi praktikum → Buka Sesi.
            </Text>
            <Text style={styles.guideStep}>
              2. Kembali ke halaman ini → Masuk sebagai Praktikan → Presensi
              pada sesi yang sama.
            </Text>
            <Text style={styles.guideStep}>
              3. Masuk kembali sebagai Asisten → Buka Rekap Presensi & lihat
              waktu hadir → Tutup Sesi.
            </Text>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 680,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  appBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  appBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  runtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  runtimeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  runtimeText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  activeUserBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  activeUserInfo: {
    flex: 1,
    minWidth: 200,
  },
  activeUserLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activeUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  activeUserMeta: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  resumeButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionHelper: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  roleTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleTab: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  roleTabActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  roleTabTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleTabTitleActive: {
    color: '#1D4ED8',
  },
  countChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countChipActive: {
    backgroundColor: '#DBEAFE',
  },
  countChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  countChipTextActive: {
    color: '#1D4ED8',
  },
  roleTabDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  roleTabDescActive: {
    color: '#1E40AF',
  },
  identityList: {
    gap: 10,
    marginBottom: 16,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  identityCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  identityBody: {
    flex: 1,
  },
  identityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  identityNameSelected: {
    color: '#1D4ED8',
  },
  identitySub: {
    fontSize: 13,
    color: '#64748B',
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rolePillAsisten: {
    backgroundColor: '#EDE9FE',
  },
  rolePillPraktikan: {
    backgroundColor: '#DCFCE7',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rolePillTextAsisten: {
    color: '#6D28D9',
  },
  rolePillTextPraktikan: {
    color: '#15803D',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyBoxText: {
    color: '#64748B',
    fontSize: 13,
  },
  guideCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  guideStep: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
