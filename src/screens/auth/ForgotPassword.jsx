import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
import { GradientShiftBackground } from '../../components/motion/GradientShiftBackground';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';

// The backend has no password-reset/OTP endpoints yet — this is built as
// complete, on-brand UI with submission disabled, per the plan's decision
// to flag this as a separate follow-up rather than fake the behavior.
export default function ForgotPassword() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');

  return (
    <GradientShiftBackground colors={[colors.surface.bg, colors.brand.accentLight + '33']}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, padding: spacing.xl, paddingTop: spacing.xxl }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radii.xl,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Rect x={4} y={10} width={16} height={10} rx={2} fill="none" stroke="#FAF9F6" strokeWidth={1.6} />
                <Path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#FAF9F6" strokeWidth={1.6} />
              </Svg>
            </View>

            <Text style={[typography.h1, { color: colors.ink.primary, marginTop: spacing.lg }]}>Forgot password?</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs }]}>
              Enter the email linked to your account and we'll send a 6-digit reset code.
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <TextField label="Email" value={email} onChangeText={setEmail} placeholder="owner@shop.com" autoCapitalize="none" keyboardType="email-address" />
            </View>

            <Button title="Send Reset Code" onPress={() => {}} disabled style={{ marginTop: spacing.xl }} />
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center', marginTop: spacing.sm }]}>
              Password reset is coming soon.
            </Text>

            <View style={{ flex: 1 }} />

            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>
              Remembered it?{' '}
              <Text style={{ color: colors.brand.accentDark, fontWeight: '600' }} onPress={() => navigation.goBack()}>
                Log In
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientShiftBackground>
  );
}
