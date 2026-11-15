import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthGateScreen() {
  const router = useRouter();
  const { authUser, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      router.replace('/auth/login');
    } else if (authUser.role === 'asisten') {
      router.replace('/asisten');
    } else {
      router.replace('/praktikan');
    }
  }, [authUser, authLoading, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.text}>Memuat sesi pengguna...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 14,
    color: '#64748B',
  },
});
