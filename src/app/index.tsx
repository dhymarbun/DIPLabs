import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/tokens';

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
      {showLanding ? (
        <ImageBackground
          source={require('../../assets/landing-campus.png')}
          style={styles.landing}
          imageStyle={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <View style={styles.content}>
            <Image
              source={require('../../assets/diplabs-logo.png')}
              resizeMode="contain"
              style={styles.logo}
              accessibilityLabel="Logo DIPLabs"
            />
          </View>
        </ImageBackground>
      ) : <View style={styles.center} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  landing: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.canvas,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backgroundImage: { opacity: 0.22 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.73)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: '78%', maxWidth: 285, height: 235 },
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
