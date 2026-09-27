import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { OptionButton, PrimaryButton } from '../components/OptionButton';
import { useOnboarding } from '../onboarding/OnboardingContext';
import type { InjuryRegion, Side } from '../types';

const REGIONS: { value: InjuryRegion; label: string }[] = [
  { value: 'KNEE', label: 'Knee' },
  { value: 'SHOULDER', label: 'Shoulder' },
  { value: 'HIP', label: 'Hip' },
  { value: 'ANKLE_FOOT', label: 'Ankle / Foot' },
  { value: 'SPINE', label: 'Spine' },
  { value: 'ELBOW_WRIST', label: 'Elbow / Wrist' },
  { value: 'GENERAL_MUSCLE', label: 'General muscle strain' },
];

const SIDES: { value: Side; label: string }[] = [
  { value: 'LEFT', label: 'Left' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'BILATERAL', label: 'Both sides' },
  { value: 'NA', label: 'Not applicable' },
];

export default function DiagnosisScreen() {
  const { state, update } = useOnboarding();
  const [diagnosisText, setDiagnosisText] = useState(state.diagnosisText);

  const canContinue = state.region !== null && state.side !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Tell us about your injury</Text>
          <Text style={styles.label}>Which area is affected?</Text>
          {REGIONS.map((r) => (
            <OptionButton
              key={r.value}
              label={r.label}
              selected={state.region === r.value}
              onPress={() => update({ region: r.value })}
            />
          ))}
          <Text style={styles.label}>Which side?</Text>
          {SIDES.map((s) => (
            <OptionButton
              key={s.value}
              label={s.label}
              selected={state.side === s.value}
              onPress={() => update({ side: s.value })}
            />
          ))}
          <Text style={styles.label}>
            Diagnosis or description (optional — in your own words, not a diagnosis we provide)
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. ACL tear, rotator cuff strain..."
            value={diagnosisText}
            onChangeText={setDiagnosisText}
            multiline
            numberOfLines={3}
          />
          <PrimaryButton
            label="Continue"
            disabled={!canContinue}
            onPress={() => {
              update({ diagnosisText });
              router.push('/surgery');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#111' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 14, color: '#333' },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
