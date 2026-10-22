import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AttendanceProvider } from '../context/AttendanceContext';

export default function RootLayout() {
  return (
    <AttendanceProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#0F172A',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
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
            title: 'DIPLabs — Absensi Praktikum',
          }}
        />
        <Stack.Screen
          name="asisten/index"
          options={{
            title: 'Jadwal Sesi Asisten',
          }}
        />
        <Stack.Screen
          name="asisten/[sessionId]"
          options={{
            title: 'Detail & Kontrol Sesi',
          }}
        />
        <Stack.Screen
          name="asisten/rekap/[sessionId]"
          options={{
            title: 'Rekap Presensi Sesi',
          }}
        />
      </Stack>
    </AttendanceProvider>
  );
}
