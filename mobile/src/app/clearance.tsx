import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { OptionButton } from '../components/OptionButton';
import { Disclaimer } from '../components/Disclaimer';
import { useOnboarding } from '../onboarding/OnboardingContext';
import type { ClearanceStatus } from '../types';

const OPTIONS: { value: ClearanceStatus; label: string }[] = [
  { value: 'PROVIDER_CONFIRMED', label: 'Yes — my surgeon/PT has explicitly cleared me for exercise' },
  { value: 'SELF_REPORTED', label: 'Yes — I believe so, though it was not written/formal' },
  { value: 'PENDING', label: 'No, or I am not sure' },
];

/**
 * Required gate (build order item 3): a user reporting a recent surgery cannot see any recovery
 * content until they answer this. "No / not sure" is a valid, saveable answer — it just keeps
 * requiresClearanceConfirmation=true on the backend, which blocks recovery content until an
 * actual confirmation is recorded later (self-reported yes, or a provider confirming it).
 */
export default function ClearanceScreen() {
  const { update } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Before we continue</Text>
      <Text style={styles.question}>Has a doctor or physical therapist cleared you for exercise?</Text>
      <Disclaimer />
      {OPTIONS.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          onPress={() => {
            update({ clearanceStatus: opt.value });
            router.push('/summary');
          }}
        />
      ))}
      <Text style={styles.footnote}>
        If you haven&apos;t been cleared yet, you can still create your account — recovery exercises just
        won&apos;t be shown until clearance is confirmed.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  question: { fontSize: 16, color: '#333', marginBottom: 16 },
  footnote: { fontSize: 12, color: '#888', marginTop: 12 },
});
