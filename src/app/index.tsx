import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAttendance } from '../context/AttendanceContext';
import { AppUser, UserRole } from '../types/attendance';

export default function LoginScreen() {
  const router = useRouter();
  const { currentUser, setCurrentUser, assistants, students } = useAttendance();

  const [role, setRole] = useState<UserRole>(currentUser?.role ?? 'asisten');
  const [identifier, setIdentifier] = useState<string>(
    currentUser?.nim ?? assistants[0]?.nim ?? ''
  );
  const [password, setPassword] = useState<string>('12345678');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dummyModalVisible, setDummyModalVisible] = useState<boolean>(false);

  const allUsersForRole = useMemo(
    () => (role === 'asisten' ? assistants : students),
    [role, assistants, students]
  );

  const matchedUser: AppUser | undefined = useMemo(() => {
    const q = identifier.trim().toLowerCase();
    if (!q) return undefined;
    return (
      allUsersForRole.find(
        (u) =>
          u.nim?.toLowerCase() === q ||
          u.id.toLowerCase() === q ||
          u.name.toLowerCase().includes(q)
      ) ?? allUsersForRole[0]
    );
  }, [allUsersForRole, identifier]);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setErrorMessage(null);
    const list = nextRole === 'asisten' ? assistants : students;
    if (list[0]?.nim) {
      setIdentifier(list[0].nim);
    }
  };

  const handleLogin = () => {
    if (!identifier.trim()) {
      setErrorMessage('Masukkan NIM atau email terlebih dahulu.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Masukkan password terlebih dahulu.');
      return;
    }
    const targetUser = matchedUser ?? allUsersForRole[0];
    if (!targetUser) {
      setErrorMessage('Akun tidak ditemukan.');
      return;
    }

    setErrorMessage(null);
    setCurrentUser(targetUser);
    router.push(targetUser.role === 'asisten' ? '/asisten' : '/praktikan');
  };

  const handleSelectDummyUser = (user: AppUser, loginImmediately: boolean) => {
    setRole(user.role);
    setIdentifier(user.nim ?? user.id);
    setPassword('12345678');
    setErrorMessage(null);
    setDummyModalVisible(false);

    if (loginImmediately) {
      setCurrentUser(user);
      router.push(user.role === 'asisten' ? '/asisten' : '/praktikan');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.headerBlock}>
            <Text style={styles.brand}>DIPLabs</Text>
            <Text style={styles.subtitle}>Presensi Praktikum</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk</Text>

            {/* Role Toggle */}
            <View style={styles.roleSegmented}>
              <Pressable
                onPress={() => handleRoleSwitch('asisten')}
                style={[
                  styles.segmentBtn,
                  role === 'asisten' && styles.segmentBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    role === 'asisten' && styles.segmentTextActive,
                  ]}
                >
                  Asisten
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRoleSwitch('praktikan')}
                style={[
                  styles.segmentBtn,
                  role === 'praktikan' && styles.segmentBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    role === 'praktikan' && styles.segmentTextActive,
                  ]}
                >
                  Praktikan
                </Text>
              </Pressable>
            </View>

            {/* Inputs */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NIM / Email</Text>
              <TextInput
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Contoh: 13522011"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {matchedUser ? (
              <View style={styles.previewAccountBox}>
                <Text style={styles.previewLabel}>Akun terpilih:</Text>
                <Text style={styles.previewValue}>
                  {matchedUser.name} ({matchedUser.nim} •{' '}
                  {matchedUser.className})
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loginBtnText}>Masuk</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => setDummyModalVisible(true)}
              style={({ pressed }) => [
                styles.dummyBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dummyBtnText}>Pilih Akun Dummy</Text>
            </Pressable>
          </View>

          {currentUser ? (
            <Pressable
              onPress={() =>
                router.push(
                  currentUser.role === 'asisten' ? '/asisten' : '/praktikan'
                )
              }
              style={({ pressed }) => [
                styles.activeSessionCard,
                pressed && styles.pressed,
              ]}
            >
              <View>
                <Text style={styles.activeSessionLabel}>Sesi login aktif</Text>
                <Text style={styles.activeSessionName}>
                  {currentUser.name} ({currentUser.role})
                </Text>
              </View>
              <Text style={styles.activeSessionLink}>Lanjut →</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* Modal Daftar Akun Dummy */}
      <Modal
        visible={dummyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDummyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daftar Akun Dummy</Text>
              <Pressable
                onPress={() => setDummyModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalText}>Tutup</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.groupHeading}>Asisten</Text>
              {assistants.map((item) => (
                <View key={item.id} style={styles.dummyItem}>
                  <View style={styles.dummyInfo}>
                    <Text style={styles.dummyName}>{item.name}</Text>
                    <Text style={styles.dummyMeta}>
                      NIM {item.nim} • Kelas {item.className}
                    </Text>
                  </View>
                  <View style={styles.dummyActions}>
                    <Pressable
                      onPress={() => handleSelectDummyUser(item, false)}
                      style={styles.fillBtn}
                    >
                      <Text style={styles.fillBtnText}>Isi Form</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSelectDummyUser(item, true)}
                      style={styles.directLoginBtn}
                    >
                      <Text style={styles.directLoginText}>Masuk</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              <Text style={[styles.groupHeading, { marginTop: 16 }]}>
                Praktikan
              </Text>
              {students.map((item) => (
                <View key={item.id} style={styles.dummyItem}>
                  <View style={styles.dummyInfo}>
                    <Text style={styles.dummyName}>{item.name}</Text>
                    <Text style={styles.dummyMeta}>
                      NIM {item.nim} • Kelas {item.className}
                    </Text>
                  </View>
                  <View style={styles.dummyActions}>
                    <Pressable
                      onPress={() => handleSelectDummyUser(item, false)}
                      style={styles.fillBtn}
                    >
                      <Text style={styles.fillBtnText}>Isi Form</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSelectDummyUser(item, true)}
                      style={styles.directLoginBtn}
                    >
                      <Text style={styles.directLoginText}>Masuk</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    gap: 16,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  roleSegmented: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  previewAccountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dummyBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  dummyBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  activeSessionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeSessionLabel: {
    fontSize: 11,
    color: '#2563EB',
  },
  activeSessionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  activeSessionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.85,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeModalBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalList: {
    marginBottom: 10,
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dummyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  dummyInfo: {
    flex: 1,
  },
  dummyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dummyMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dummyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fillBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  directLoginBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  directLoginText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
