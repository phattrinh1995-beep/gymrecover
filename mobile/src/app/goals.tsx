import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { OptionButton, PrimaryButton } from '../components/OptionButton';
import { useOnboarding } from '../onboarding/OnboardingContext';
import type { ActivityLevel } from '../types';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'SEDENTARY', label: 'Sedentary — little to no regular exercise' },
  { value: 'LIGHT', label: 'Light — exercise 1-2 days/week' },
  { value: 'MODERATE', label: 'Moderate — exercise 3-4 days/week' },
  { value: 'ACTIVE', label: 'Active — exercise 5+ days/week' },
  { value: 'ATHLETE', label: 'Athlete — trains/competes regularly' },
];

export default function GoalsScreen() {
  const { state, update } = useOnboarding();
  const [goals, setGoals] = useState(state.goals);

  const canContinue = state.activityLevel !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Your goals & activity level</Text>
          <Text style={styles.label}>What are you hoping to get out of GymRecover?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. get back to running, build strength, recover from surgery..."
            value={goals}
            onChangeText={setGoals}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.label}>How active are you currently?</Text>
          {ACTIVITY_LEVELS.map((level) => (
            <OptionButton
              key={level.value}
              label={level.label}
              selected={state.activityLevel === level.value}
              onPress={() => update({ activityLevel: level.value })}
            />
          ))}
          <PrimaryButton
            label="Continue"
            disabled={!canContinue}
            onPress={() => {
              update({ goals });
              router.push('/injury-intake');
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
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, color: '#111' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 8, color: '#333' },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
