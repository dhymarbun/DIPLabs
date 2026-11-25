import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { AttendanceProvider } from '../context/AttendanceContext';
import { PermissionProvider } from '../context/PermissionContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { authUser, authLoading } = useAuth();
  const area = segments[0];

  useEffect(() => {
    if (authLoading) return;
    const isProtectedArea =
      area === 'asisten' || area === 'praktikan' || area === 'maps';
    let destination: '/auth/login' | '/asisten' | '/praktikan' | null = null;

    if (!authUser && isProtectedArea) {
      destination = '/auth/login';
    } else if (authUser && area === 'auth') {
      destination = authUser.role === 'asisten' ? '/asisten' : '/praktikan';
    } else if (authUser?.role === 'praktikan' && area === 'asisten') {
      destination = '/praktikan';
    } else if (authUser?.role === 'asisten' && area === 'praktikan') {
      destination = '/asisten';
    }

    // Avoid replacing the active screen with itself: it creates duplicate
    // route transitions and made the schedule flow appear to loop.
    if (destination && pathname !== destination) {
      router.replace(destination);
    }
  }, [area, authLoading, authUser, pathname, router]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <PermissionProvider>
          <NotificationProvider>
            <RouteGuard />
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#FFFFFF',
                },
                headerTintColor: '#0F172A',
                headerTitleStyle: {
                  fontWeight: '700',
                  fontSize: 16,
                },
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/login"
                options={{
                  title: 'Masuk',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/register"
                options={{
                  title: 'Daftar Akun',
                }}
              />
              <Stack.Screen
                name="asisten/index"
                options={{
                  title: 'Jadwal Praktikum',
                }}
              />
              <Stack.Screen
                name="asisten/[sessionId]"
                options={{
                  title: 'Detail Sesi',
                }}
              />
              <Stack.Screen
                name="asisten/rekap/[sessionId]"
                options={{
                  title: 'Rekap Presensi',
                }}
              />
              <Stack.Screen
                name="asisten/praktikum"
                options={{
                  title: 'Kelola Data Praktikum',
                }}
              />
              <Stack.Screen
                name="asisten/izin"
                options={{
                  title: 'Pengajuan Izin Praktikan',
                }}
              />
              <Stack.Screen name="praktikan/index" options={{ headerShown: false }} />
              <Stack.Screen name="praktikan/jadwal" options={{ title: 'Jadwal Praktikum' }} />
              <Stack.Screen name="praktikan/[sessionId]" options={{ title: 'Detail Sesi' }} />
              <Stack.Screen name="praktikan/riwayat" options={{ title: 'Riwayat Presensi' }} />
              <Stack.Screen name="praktikan/izin" options={{ title: 'Pengajuan Izin' }} />
              <Stack.Screen name="maps/index" options={{ title: 'Peta Laboratorium' }} />
            </Stack>
          </NotificationProvider>
        </PermissionProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}
