import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { OptionButton } from '../components/OptionButton';
import { useOnboarding } from '../onboarding/OnboardingContext';

export default function InjuryIntakeScreen() {
  const { update } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>One more thing</Text>
      <Text style={styles.question}>
        Are you currently recovering from an injury or surgery?
      </Text>
      <OptionButton
        label="Yes, I'm recovering from an injury or surgery"
        onPress={() => {
          update({ hasCurrentInjury: true });
          router.push('/diagnosis');
        }}
      />
      <OptionButton
        label="No, I'm training as a healthy athlete/gym member"
        onPress={() => {
          update({ hasCurrentInjury: false });
          router.push('/summary');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  question: { fontSize: 16, color: '#333', marginBottom: 20 },
});
