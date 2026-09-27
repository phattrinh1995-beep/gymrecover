import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OptionButton, PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import type { PerformanceGoal } from '../types';

const GOALS: { value: PerformanceGoal; label: string; description: string }[] = [
  { value: 'STRENGTH', label: 'Strength', description: 'Lower-rep, heavier-load compound lifts.' },
  { value: 'HYPERTROPHY', label: 'Hypertrophy', description: 'Moderate-rep training for muscle growth.' },
  { value: 'CONDITIONING', label: 'Conditioning', description: 'Cardiovascular/metabolic circuit training.' },
];

/**
 * Performance track program builder (build order item 9) — picks one of the seeded general
 * templates by goal. Reused for both a fresh performance-track sign-up and the "graduate" action
 * from a completed recovery program (graduateFromInstanceId param set in the latter case).
 */
export default function PerformanceGoalScreen() {
  const { graduateFromInstanceId } = useLocalSearchParams<{ graduateFromInstanceId?: string }>();
  const { user } = useAuth();
  const [goal, setGoal] = useState<PerformanceGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!user || !goal) return;
    setSubmitting(true);
    try {
      if (graduateFromInstanceId) {
        await apiFetch(user, `/program-instances/${graduateFromInstanceId}/graduate`, {
          method: 'POST',
          body: { performanceGoal: goal },
        });
      } else {
        await apiFetch(user, '/program-instances/performance', { method: 'POST', body: { goal } });
      }
      router.replace('/home');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{graduateFromInstanceId ? 'Graduate to performance track' : 'Choose your goal'}</Text>
      {graduateFromInstanceId && (
        <Text style={styles.note}>
          This marks your recovery program complete and starts a general fitness program — your
          recovery history stays on record.
        </Text>
      )}
      {GOALS.map((g) => (
        <OptionButton
          key={g.value}
          label={`${g.label} — ${g.description}`}
          selected={goal === g.value}
          onPress={() => setGoal(g.value)}
        />
      ))}
      {submitting ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!goal} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  note: { fontSize: 14, color: '#666', marginBottom: 20 },
  spinner: { marginTop: 20 },
});
