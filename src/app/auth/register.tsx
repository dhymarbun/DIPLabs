import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { UserRole } from '../../types/attendance';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, authUser, authLoading } = useAuth();
  const { classes } = useAttendance();

  const [role, setRole] = useState<UserRole>('praktikan');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [nim, setNim] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [classPickerOpen, setClassPickerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && authUser) router.replace(authUser.role === 'asisten' ? '/asisten' : '/praktikan');
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (!className) return;
    const stillExists = classes.some((c) => c.name === className);
    if (!stillExists) {
      setClassName('');
      setErrorMessage('Kelas yang dipilih sudah tidak tersedia. Pilih kelas lain.');
    }
  }, [classes, className]);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }
    if (!className) {
      setErrorMessage('Kelas harus dipilih dari daftar yang tersedia.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        nim: nim.trim(),
        className,
      });
      router.replace(role === 'asisten' ? '/asisten' : '/praktikan');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal mendaftarkan akun.'
      );
    } finally {
      setSubmitting(false);
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
          <View style={styles.brandPanel}><Image source={require('../../../assets/diplabs-logo.png')} resizeMode="contain" style={styles.logo}/><Text style={styles.brand}>DIPLabs</Text></View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Buat Akun Praktikan</Text>
            <Text style={styles.intro}>Daftar menggunakan identitas mahasiswa Anda.</Text>

            <Text style={styles.label}>Peran Pengguna</Text>
            <View style={styles.roleSegmented}>
              <Pressable
                onPress={() => setRole('praktikan')}
                disabled={submitting}
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
              <Text style={styles.roleHint}>Akun asisten dibuat oleh administrator.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nama Lengkap<Text style={styles.requiredMark}> *</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nama lengkap Anda"
                placeholderTextColor="#94A3B8"
                editable={!submitting}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Email<Text style={styles.requiredMark}> *</Text>
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="nama@mahasiswa.ac.id"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Password<Text style={styles.requiredMark}> *</Text>
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  editable={!submitting}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  disabled={submitting}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  NIM<Text style={styles.requiredMark}> *</Text>
                </Text>
                <TextInput
                  value={nim}
                  onChangeText={setNim}
                  placeholder="13523xxx"
                  placeholderTextColor="#94A3B8"
                  editable={!submitting}
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Kelas<Text style={styles.requiredMark}> *</Text>
                </Text>
                <Pressable
                  onPress={() => setClassPickerOpen(true)}
                  disabled={submitting}
                  style={styles.classSelect}
                >
                  <Text
                    style={[
                      styles.classSelectText,
                      !className && styles.classSelectPlaceholder,
                    ]}
                  >
                    {className || 'Pilih kelas'}
                  </Text>
                  <Text style={styles.classSelectAction}>
                    {className ? 'Ganti' : 'Pilih'}
                  </Text>
                </Pressable>
                {classes.length === 0 ? (
                  <Text style={styles.classWarning}>
                    Belum ada kelas. Hubungi asisten untuk membuat kelas.
                  </Text>
                ) : null}
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                submitting && styles.btnDisabled,
                pressed && !submitting && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Daftar</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} disabled={submitting} style={styles.loginLink}><Text style={styles.footerLink}>Sudah punya akun? Masuk</Text></Pressable>
            <Text style={styles.caption}>Sistem Manajemen Praktikum Laboratorium</Text>
          </View>
        </View>
      <Modal
        visible={classPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setClassPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Kelas</Text>
            {classes.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada kelas. Hubungi asisten.
              </Text>
            ) : (
              <ScrollView
                style={styles.modalList}
                contentContainerStyle={styles.modalListContent}
              >
                {classes.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setClassName(c.name);
                      setClassPickerOpen(false);
                    }}
                    style={[
                      styles.modalOption,
                      className === c.name && styles.modalOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        className === c.name && styles.modalOptionTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                    {className === c.name && (
                      <Text style={styles.modalOptionMark}>Dipilih</Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable
              onPress={() => setClassPickerOpen(false)}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F1ED',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  container: {
    width: '100%', maxWidth: 420, gap: 28,
  },
  brandPanel: { height: 185, borderRadius: 28, backgroundColor: '#232420', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 76, height: 64, marginBottom: 12 }, brand: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  card: {
    backgroundColor: 'transparent', padding: 0,
  },
  cardTitle: {
    fontSize: 25, fontWeight: '500', color: '#232420', marginBottom: 12,
  },
  intro: { fontSize: 14, color: '#5E5F58', marginBottom: 20 },
  roleSegmented: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  roleHint: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
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
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 0, borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#232420', backgroundColor: '#FFFFFF',
  },
  classSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  classSelectText: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },
  classSelectPlaceholder: {
    color: '#94A3B8',
  },
  classSelectAction: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  classWarning: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalList: {
    maxHeight: 340,
  },
  modalListContent: {
    gap: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  modalOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOptionTextActive: {
    color: '#1D4ED8',
  },
  modalOptionMark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
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
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#FFC332',
    paddingVertical: 13,
    borderRadius: 26,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    color: '#232420',
    fontSize: 14,
    fontWeight: '700',
  },
  loginLink: { marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232420',
  },
  caption: { marginTop: 16, color: '#5E5F58', fontSize: 11 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#232420',
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E5F58',
  },
  pressed: {
    opacity: 0.85,
  },
});
