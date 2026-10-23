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
      </Stack>
    </AttendanceProvider>
  );
}
