import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';
import { useOnboarding } from '../onboarding/OnboardingContext';

export default function SignUpScreen() {
  const { login } = useAuth();
  const { update } = useOnboarding();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const canContinue = email.includes('@') && firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleContinue = async () => {
    await login(email);
    update({ firstName, lastName });
    router.push('/goals');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.note}>
          Dev preview: no real Auth0 tenant is connected yet, so this just creates a local demo
          account from your email — see PROGRESS.md.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111' },
  note: { fontSize: 13, color: '#888', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
});
