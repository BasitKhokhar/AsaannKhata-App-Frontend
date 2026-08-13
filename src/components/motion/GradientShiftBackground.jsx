import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

// LinearGradient's `colors` prop isn't Reanimated-animatable, so the
// "gradient shift" effect is faked by cross-fading two diagonally-offset
// gradient layers of the same palette — used behind Splash/Onboarding.
export function GradientShiftBackground({ colors: gradientColors, children }) {
  const { motion } = useTheme();
  const palette = gradientColors;

  return (
    <MotiView style={StyleSheet.absoluteFill}>
      <LinearGradient colors={palette} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <MotiView
        style={StyleSheet.absoluteFill}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ type: 'timing', duration: motion.duration.gradientShift, loop: true }}
      >
        <LinearGradient colors={palette} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      </MotiView>
      {children}
    </MotiView>
  );
}
