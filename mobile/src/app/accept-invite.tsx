import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

/**
 * Redeems an org invite created in the provider web portal (build order item 10). No real email
 * delivery exists yet, so the invited person is given the token directly by their org admin and
 * enters it here after signing in — see backend/src/organizations/organizations.service.ts.
 */
export default function AcceptInviteScreen() {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !token.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(user, `/organizations/invites/${token.trim()}/accept`, { method: 'POST' });
      router.replace('/home');
    } catch {
      setError('Could not accept this invite. Check the token and that it matches your account email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Join your organization</Text>
      <Text style={styles.body}>
        Enter the invite token your gym/clinic admin shared with you. It must match the email you
        signed in with.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Invite token"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {submitting ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <PrimaryButton label="Join" onPress={handleSubmit} disabled={!token.trim()} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  body: { fontSize: 14, color: '#555', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  error: { color: '#C0392B', marginBottom: 12 },
  spinner: { marginTop: 20 },
});
