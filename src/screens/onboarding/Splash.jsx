import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NATIVE_SPLASH_ACCENT, NATIVE_SPLASH_BACKGROUND } from '../../theme/colors';

const AUTO_ADVANCE_MS = 1800;

export default function Splash() {
  const navigation = useNavigation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Onboarding1'), AUTO_ADVANCE_MS);
    Animated.timing(progress, {
      toValue: 1,
      duration: AUTO_ADVANCE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => clearTimeout(timer);
  }, [navigation, progress]);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.screen}>
      <View style={styles.centerContent}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Asaan Dukaan"
        />
        <View style={styles.progressTrack} accessibilityLabel="Loading">
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerText}>made by Basit Dev</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NATIVE_SPLASH_BACKGROUND },
  centerContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96 },
  progressTrack: { width: 44, height: 3, marginTop: 20, overflow: 'hidden', borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: NATIVE_SPLASH_ACCENT },
  footer: { position: 'absolute', right: 0, bottom: 0, left: 0, alignItems: 'center', paddingBottom: 14 },
  footerText: { color: 'rgba(255,255,255,0.68)', fontSize: 11, letterSpacing: 0.4 },
});
