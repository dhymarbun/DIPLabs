import React, { useEffect, useState } from 'react';
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
import { isFirebaseConfigured } from '../../firebase/config';

export default function LoginScreen() {
  const router = useRouter();
  const { authUser, authLoading, login } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && authUser) {
      router.replace(authUser.role === 'asisten' ? '/asisten' : '/praktikan');
    }
  }, [authUser, authLoading, router]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setErrorMessage('Masukkan alamat email terlebih dahulu.');
      return;
    }
    if (!password) {
      setErrorMessage('Masukkan password terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal masuk ke akun.'
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
          <View style={styles.headerBlock}>
            <Text style={styles.brand}>DIPLabs</Text>
            <Text style={styles.subtitle}>Manajemen Presensi Praktikum</Text>
          </View>

          {!isFirebaseConfigured ? (
            <View style={styles.configWarning}>
              <Text style={styles.configWarningTitle}>
                Konfigurasi Firebase Belum Diisi
              </Text>
              <Text style={styles.configWarningText}>
                Salin file .env.example menjadi .env lalu isi variabel
                EXPO_PUBLIC_FIREBASE_* dari Firebase Console.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk ke Akun</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="nama@mahasiswa.ac.id"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
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
                editable={!submitting}
                style={styles.input}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.loginBtn,
                submitting && styles.btnDisabled,
                pressed && !submitting && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Masuk</Text>
              )}
            </Pressable>

            <View style={styles.registerPromptRow}>
              <Text style={styles.registerPromptText}>Belum punya akun?</Text>
              <Pressable
                onPress={() => router.push('/auth/register')}
                disabled={submitting}
              >
                <Text style={styles.registerLink}>Daftar Sekarang</Text>
              </Pressable>
            </View>
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
  configWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  configWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  configWarningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
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
    marginBottom: 16,
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
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  registerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  registerPromptText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.85,
  },
});
