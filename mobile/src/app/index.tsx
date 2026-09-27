import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/OptionButton';
import { useAuth } from '../auth/AuthContext';

export default function WelcomeScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [isLoading, user]);

  if (isLoading || user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>GymRecover</Text>
        <Text style={styles.subtitle}>
          Guided strength training and structured recovery, in one place.
        </Text>
        <PrimaryButton label="Get Started" onPress={() => router.push('/sign-up')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 12, color: '#111' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 32 },
});
