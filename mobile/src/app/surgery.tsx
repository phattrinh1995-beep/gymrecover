import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { OptionButton, PrimaryButton } from '../components/OptionButton';
import { useOnboarding } from '../onboarding/OnboardingContext';

export default function SurgeryScreen() {
  const { state, update } = useOnboarding();
  const [surgeryType, setSurgeryType] = useState(state.surgeryType);
  const [surgeryDate, setSurgeryDate] = useState(state.surgeryDate ?? '');

  const detailsValid = surgeryType.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(surgeryDate);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Surgery history</Text>
          <Text style={styles.question}>Did you have surgery for this injury?</Text>
          <OptionButton
            label="Yes"
            selected={state.hadSurgery === true}
            onPress={() => update({ hadSurgery: true })}
          />
          <OptionButton
            label="No"
            selected={state.hadSurgery === false}
            onPress={() => {
              update({ hadSurgery: false, surgeryType: '', surgeryDate: null, clearanceStatus: null });
              router.push('/summary');
            }}
          />
          {state.hadSurgery === true && (
            <>
              <Text style={styles.label}>What surgery did you have?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ACL reconstruction"
                value={surgeryType}
                onChangeText={setSurgeryType}
              />
              <Text style={styles.label}>Surgery date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-06-15"
                value={surgeryDate}
                onChangeText={setSurgeryDate}
              />
              <PrimaryButton
                label="Continue"
                disabled={!detailsValid}
                onPress={() => {
                  update({ surgeryType, surgeryDate });
                  router.push('/clearance');
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  question: { fontSize: 16, color: '#333', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 14, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
});
