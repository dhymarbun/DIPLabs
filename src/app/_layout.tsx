import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { AttendanceProvider } from '../context/AttendanceContext';
import { PermissionProvider } from '../context/PermissionContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { authUser, authLoading } = useAuth();
  const area = segments[0];

  useEffect(() => {
    if (authLoading) return;
    if (!authUser && (area === 'asisten' || area === 'praktikan')) {
      router.replace('/auth/login');
    } else if (authUser && area === 'auth') {
      router.replace(authUser.role === 'asisten' ? '/asisten' : '/praktikan');
    } else if (authUser?.role === 'praktikan' && area === 'asisten') {
      router.replace('/praktikan');
    } else if (authUser?.role === 'asisten' && area === 'praktikan') {
      router.replace('/asisten');
    }
  }, [area, authLoading, authUser, router]);

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
            </Stack>
          </NotificationProvider>
        </PermissionProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}