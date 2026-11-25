import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
          <View style={styles.brandPanel}>
            <Image
              source={require('../../../assets/diplabs-logo.png')}
              resizeMode="contain"
              style={styles.logo}
            />
            <Text style={styles.brand}>DIPLabs</Text>
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

          <View style={styles.form}>
            <Text style={styles.cardTitle}>Selamat Datang Kembali</Text>
            <Text style={styles.intro}>Masuk untuk mengelola praktikum dan presensi Anda.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Email<Text style={styles.requiredMark}> *</Text>
              </Text>
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
              <Text style={styles.label}>
                Password<Text style={styles.requiredMark}> *</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Masukkan kata sandi"
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

            <Pressable
              onPress={() => router.push('/auth/register')}
              disabled={submitting}
              style={({ pressed }) => [styles.registerButton, pressed && !submitting && styles.pressed]}
            >
              <Text style={styles.registerLink}>Belum punya akun? Daftar</Text>
            </Pressable>
            <Text style={styles.caption}>Sistem Manajemen Praktikum Laboratorium</Text>
          </View>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    gap: 28,
  },
  brandPanel: {
    height: 185,
    backgroundColor: '#232420',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 76, height: 64, marginBottom: 12 },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
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
  form: {
    gap: 0,
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: '500',
    color: '#232420',
    marginBottom: 16,
  },
  intro: {
    fontSize: 14,
    color: '#5E5F58',
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#232420',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 0,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#232420',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFC332',
    paddingVertical: 13,
    borderRadius: 26,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  loginBtnText: {
    color: '#232420',
    fontSize: 14,
    fontWeight: '700',
  },
  registerButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '500',
    color: '#232420',
  },
  caption: { color: '#5E5F58', fontSize: 11, marginTop: 16 },
  pressed: {
    opacity: 0.85,
  },
});
