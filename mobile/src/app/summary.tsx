import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

export default function SummaryScreen() {
  const { state } = useOnboarding();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(user, '/users/me/profile', {
        method: 'PATCH',
        body: {
          firstName: state.firstName,
          lastName: state.lastName,
          goals: state.goals || undefined,
          activityLevel: state.activityLevel,
        },
      });

      if (state.hasCurrentInjury && state.region && state.side) {
        await apiFetch(user, '/injury-profiles', {
          method: 'POST',
          body: {
            region: state.region,
            side: state.side,
            diagnosisText: state.diagnosisText || undefined,
            surgeryType: state.hadSurgery ? state.surgeryType : undefined,
            surgeryDate: state.hadSurgery ? state.surgeryDate : undefined,
            clearanceStatus: state.hadSurgery ? state.clearanceStatus : undefined,
          },
        });
      }

      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review & confirm</Text>
        <Row label="Name" value={`${state.firstName} ${state.lastName}`} />
        <Row label="Activity level" value={state.activityLevel ?? '—'} />
        {state.goals ? <Row label="Goals" value={state.goals} /> : null}
        {state.hasCurrentInjury ? (
          <>
            <Row label="Injury area" value={`${state.region ?? '—'} (${state.side ?? '—'})`} />
            {state.hadSurgery ? (
              <>
                <Row label="Surgery" value={`${state.surgeryType} on ${state.surgeryDate}`} />
                <Row label="Cleared for exercise" value={clearanceLabel(state.clearanceStatus)} />
              </>
            ) : (
              <Row label="Surgery" value="No surgery reported" />
            )}
          </>
        ) : (
          <Row label="Track" value="Performance / general fitness (no injury reported)" />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {submitting ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <PrimaryButton label="Finish setup" onPress={handleFinish} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function clearanceLabel(status: string | null): string {
  if (status === 'PROVIDER_CONFIRMED') return 'Yes, provider confirmed';
  if (status === 'SELF_REPORTED') return 'Yes, self-reported';
  return 'Not yet — recovery content stays hidden until confirmed';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.row}>
      <Text style={styles.rowLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#111' },
  row: { fontSize: 15, color: '#333', marginBottom: 10 },
  rowLabel: { fontWeight: '600', color: '#111' },
  error: { color: '#C0392B', marginTop: 12, marginBottom: 4 },
  spinner: { marginTop: 16 },
});
