import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NATIVE_SPLASH_BACKGROUND } from '../../theme/colors';

const AUTO_ADVANCE_MS = 1800;

export default function Splash() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Onboarding1'), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Asaan Dukaan"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NATIVE_SPLASH_BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96 },
});
