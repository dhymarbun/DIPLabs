import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { fetchUserProfile, saveUserProfile } from '../services/firestore';
import { AuthContextValue, AuthUser, RegisterInput } from '../types/attendance';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email atau password salah.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.';
    case 'auth/weak-password':
      return 'Password terlalu pendek (minimal 6 karakter).';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    default:
      if (!isFirebaseConfigured) {
        return 'Konfigurasi Firebase (.env) belum diisi. Pastikan variabel EXPO_PUBLIC_FIREBASE_* sudah diatur.';
      }
      return error instanceof Error
        ? error.message
        : 'Terjadi kesalahan saat memproses autentikasi.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        setAuthUser(null);
        setAuthLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeProfile = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setAuthUser({
              uid: firebaseUser.uid,
              name: String(
                data.name ?? firebaseUser.displayName ?? firebaseUser.email ?? 'Pengguna'
              ),
              email: String(data.email ?? firebaseUser.email ?? ''),
              role: data.role === 'asisten' ? 'asisten' : 'praktikan',
              nim: data.nim ? String(data.nim) : undefined,
              className: data.className ? String(data.className) : undefined,
            });
          } else {
            setAuthUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName ?? firebaseUser.email ?? 'Pengguna',
              email: firebaseUser.email ?? '',
              role: 'praktikan',
            });
          }
          setAuthLoading(false);
        },
        () => {
          setAuthLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error('Email dan password wajib diisi.');
    }
    if (!isFirebaseConfigured) {
      throw new Error(
        'Konfigurasi Firebase belum diatur di file .env (EXPO_PUBLIC_FIREBASE_*).'
      );
    }

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const profile = await fetchUserProfile(cred.user.uid);
      if (profile) {
        setAuthUser(profile);
      }
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const name = input.name.trim();
    const email = input.email.trim();
    const nim = input.nim?.trim();
    const className = input.className?.trim();

    if (!name) {
      throw new Error('Nama lengkap wajib diisi.');
    }
    if (!email) {
      throw new Error('Alamat email wajib diisi.');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Password minimal terdiri dari 6 karakter.');
    }
    if (!isFirebaseConfigured) {
      throw new Error(
        'Konfigurasi Firebase belum diatur di file .env (EXPO_PUBLIC_FIREBASE_*).'
      );
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        input.password
      );
      await updateProfile(cred.user, { displayName: name });

      const newUser: AuthUser = {
        uid: cred.user.uid,
        name,
        email,
        role: input.role,
        nim: nim || undefined,
        className: className || undefined,
      };

      await saveUserProfile(newUser);
      setAuthUser(newUser);
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setAuthUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      authLoading,
      login,
      register,
      logout,
    }),
    [authUser, authLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
