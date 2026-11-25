import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthGateScreen() {
  const router = useRouter();
  const { authUser, authLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLanding(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authLoading || showLanding) return;

    if (!authUser) {
      router.replace('/auth/login');
    } else if (authUser.role === 'asisten') {
      router.replace('/asisten');
    } else {
      router.replace('/praktikan');
    }
  }, [authUser, authLoading, router, showLanding]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {showLanding || authLoading ? (
        <View style={styles.landing}>
          <Image source={require('../../assets/landing-campus.png')} style={styles.background} />
          <View style={styles.overlay} />
          <View style={styles.brandLockup}>
            <Text style={styles.brand}>DIPLabs</Text>
            <Text style={styles.brandCaption}>PRACTICUM ATTENDANCE</Text>
          </View>
        </View>
      ) : <View style={styles.center} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F1ED',
  },
  landing: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F2F1ED',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    opacity: 0.08,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F1ED',
    opacity: 0.76,
  },
  brandLockup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    color: '#232420',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
  },
  brandCaption: {
    color: '#5E5F58',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 8,
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
