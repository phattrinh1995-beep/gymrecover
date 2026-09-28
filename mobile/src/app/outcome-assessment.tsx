import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { ScalePicker } from '../components/ScalePicker';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import type { PromDefinition } from '../types';

/**
 * Periodic PROM questionnaire (build order item 7). The question text shown here is a
 * clearly-labeled PLACEHOLDER — see backend/src/outcome-assessments/prom-definitions.ts for why
 * the real KOOS/QuickDASH item wording isn't reproduced here.
 */
export default function OutcomeAssessmentScreen() {
  const { injuryProfileId } = useLocalSearchParams<{ injuryProfileId: string }>();
  const { user } = useAuth();
  const [definition, setDefinition] = useState<PromDefinition | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!user || !injuryProfileId) return;
    apiFetch<PromDefinition>(user, `/outcome-assessments/definition?injuryProfileId=${injuryProfileId}`)
      .then(setDefinition)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 400) {
          setUnsupported(true);
        } else {
          setError('Could not load the questionnaire.');
        }
      })
      .finally(() => setLoading(false));
  }, [user, injuryProfileId]);

  const allAnswered = definition ? definition.questions.every((q) => answers[q.id] !== undefined) : false;

  const handleSubmit = async () => {
    if (!user || !injuryProfileId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(user, '/outcome-assessments', { method: 'POST', body: { injuryProfileId, answers } });
      router.replace('/outcome-trend');
    } catch {
      setError('Could not save your answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.spinner} />
      </SafeAreaView>
    );
  }

  if (unsupported) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>No questionnaire available</Text>
        <Text style={styles.body}>
          A standardized outcome measure isn&apos;t configured for this injury&apos;s region yet.
        </Text>
        <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{definition?.title}</Text>
        <Text style={styles.instructions}>{definition?.instructions}</Text>

        {definition?.questions.map((q, i) => (
          <React.Fragment key={q.id}>
            <Text style={styles.question}>
              {i + 1}. {q.text}
            </Text>
            <ScalePicker
              min={q.min}
              max={q.max}
              value={answers[q.id] ?? null}
              onChange={(n) => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
            />
          </React.Fragment>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}
        <PrimaryButton
          label={submitting ? 'Saving…' : 'Submit'}
          onPress={handleSubmit}
          disabled={!allAnswered || submitting}
        />
        <Text style={styles.citation}>{definition?.citation}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#111' },
  instructions: { fontSize: 14, color: '#555', marginBottom: 20 },
  question: { fontSize: 15, color: '#222', marginBottom: 8, marginTop: 12 },
  body: { fontSize: 15, color: '#333', marginBottom: 20 },
  error: { color: '#C0392B', marginBottom: 12 },
  spinner: { marginTop: 40 },
  citation: { fontSize: 11, color: '#999', marginTop: 16, fontStyle: 'italic' },
});
