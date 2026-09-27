import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';

interface Symptom {
  key:
    | 'severeOrWorseningPain'
    | 'newOrIncreasingSwelling'
    | 'fever'
    | 'numbnessOrTingling'
    | 'calfPainOrSwelling'
    | 'chestPainOrShortnessOfBreath';
  label: string;
}

const SYMPTOMS: Symptom[] = [
  { key: 'severeOrWorseningPain', label: 'Severe or worsening pain' },
  { key: 'newOrIncreasingSwelling', label: 'New or increasing swelling' },
  { key: 'fever', label: 'Fever' },
  { key: 'numbnessOrTingling', label: 'Numbness or tingling' },
  { key: 'calfPainOrSwelling', label: 'Calf pain or swelling' },
  { key: 'chestPainOrShortnessOfBreath', label: 'Chest pain or shortness of breath' },
];

type CheckedState = Record<Symptom['key'], boolean>;

const initialChecked: CheckedState = {
  severeOrWorseningPain: false,
  newOrIncreasingSwelling: false,
  fever: false,
  numbnessOrTingling: false,
  calfPainOrSwelling: false,
  chestPainOrShortnessOfBreath: false,
};

/**
 * Red-flag triage gate (build order item 4). Runs before every recovery-track session.
 * If any symptom is checked, the session is blocked with no way to dismiss and continue anyway —
 * the only actions from the blocked state are informational or "return home".
 */
export default function RedFlagCheckScreen() {
  const { injuryProfileId } = useLocalSearchParams<{ injuryProfileId: string }>();
  const { user } = useAuth();
  const [checked, setChecked] = useState<CheckedState>(initialChecked);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: Symptom['key']) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleContinue = async () => {
    if (!user || !injuryProfileId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ allowed: boolean; programInstanceId: string; sessionLogId: string }>(
        user,
        '/session-logs/red-flag-check',
        { method: 'POST', body: { injuryProfileId, ...checked } },
      );
      if (result.allowed) {
        router.push({
          pathname: '/session',
          params: { programInstanceId: result.programInstanceId, sessionLogId: result.sessionLogId },
        });
      } else {
        setBlocked(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (blocked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedTitle}>Please seek medical care</Text>
          <Text style={styles.blockedBody}>
            Based on what you reported, you should not continue with this exercise session. Contact
            your doctor or physical therapist, or seek urgent/emergency care if symptoms are severe
            (especially chest pain/shortness of breath or calf pain/swelling, which can be signs of a
            medical emergency).
          </Text>
        </View>
        <View style={styles.blockedActions}>
          <PrimaryButton label="Return to Home" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.question}>Are you experiencing any of the following right now?</Text>
        {SYMPTOMS.map((symptom) => (
          <Checkbox
            key={symptom.key}
            label={symptom.label}
            checked={checked[symptom.key]}
            onToggle={() => toggle(symptom.key)}
          />
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {submitting ? (
          <ActivityIndicator style={styles.spinner} />
        ) : (
          <PrimaryButton label="None of the above — continue" onPress={handleContinue} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Checkbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Text style={[styles.checkboxRow, checked && styles.checkboxRowChecked]} onPress={onToggle}>
      {checked ? '[x] ' : '[ ] '}
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  question: { fontSize: 16, color: '#333', marginBottom: 20 },
  checkboxRow: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    color: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  checkboxRowChecked: { color: '#C0392B', fontWeight: '600' },
  error: { color: '#C0392B', marginTop: 12, marginBottom: 4 },
  spinner: { marginTop: 24 },
  blockedBanner: {
    backgroundColor: '#FDECEA',
    borderColor: '#C0392B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 24,
  },
  blockedTitle: { fontSize: 20, fontWeight: '700', color: '#C0392B', marginBottom: 8 },
  blockedBody: { fontSize: 15, color: '#7A2118', lineHeight: 21 },
  blockedActions: { paddingHorizontal: 24 },
});
