import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../auth/AuthContext';
import { OnboardingProvider } from '../onboarding/OnboardingContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </OnboardingProvider>
    </AuthProvider>
  );
}
