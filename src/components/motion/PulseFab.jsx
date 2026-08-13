import React from 'react';
import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

// Amber FAB with a pulsing ring behind it — Dashboard / Products List "+".
export function PulseFab({ onPress, icon, size = 52 }) {
  const { colors, radii, motion } = useTheme();

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <MotiView
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radii.pill,
          backgroundColor: colors.brand.accent,
        }}
        animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
        transition={{ type: 'timing', duration: motion.duration.pulse, loop: true }}
      />
      <Pressable onPress={onPress} hitSlop={8}>
        <LinearGradient
          colors={colors.gradient.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.ink.primary,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          {icon}
        </LinearGradient>
      </Pressable>
    </View>
  );
}
