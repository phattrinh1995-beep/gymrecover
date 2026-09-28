import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import type { OutcomeAssessmentSummary } from '../types';

const CHART_HEIGHT = 140;

/** Simple trend chart (build order item 7) — a plain proportional bar chart, no charting library,
 * since the requirement is "a simple trend chart," not a full analytics dashboard. */
export default function OutcomeTrendScreen() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<OutcomeAssessmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<OutcomeAssessmentSummary[]>(user, '/outcome-assessments')
      .then(setAssessments)
      .catch(() => setError('Could not load your progress. Please try again.'));
  }, [user]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.body}>{error}</Text>
          <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  if (!assessments) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.spinner} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your progress</Text>
        {assessments.length === 0 ? (
          <Text style={styles.body}>No assessments logged yet.</Text>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {assessments[assessments.length - 1].type === 'KOOS'
                ? 'Knee score (0-100, higher is better)'
                : 'Arm/shoulder disability score (0-100, lower is better)'}
            </Text>
            <View style={styles.chart}>
              {assessments.map((a) => (
                <View key={a.id} style={styles.barColumn}>
                  <View style={[styles.bar, { height: Math.max(4, (a.score / 100) * CHART_HEIGHT) }]} />
                  <Text style={styles.barScore}>{a.score}</Text>
                  <Text style={styles.barDate}>{new Date(a.assessedAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  body: { fontSize: 15, color: '#333', marginBottom: 20 },
  spinner: { marginTop: 40 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 40,
    marginBottom: 24,
    gap: 10,
  },
  barColumn: { alignItems: 'center', width: 44 },
  bar: { width: 24, backgroundColor: '#2A6DF4', borderRadius: 4 },
  barScore: { fontSize: 12, fontWeight: '700', color: '#111', marginTop: 4 },
  barDate: { fontSize: 10, color: '#888', marginTop: 2 },
});
