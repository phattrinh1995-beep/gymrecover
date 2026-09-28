import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import type { MeResponse } from '../types';
import { Disclaimer } from '../components/Disclaimer';
import { PrimaryButton } from '../components/OptionButton';

/**
 * Landing screen for after onboarding. Recovery-track: red-flag triage gate → today's exercises →
 * the Adaptive Program Engine's phase-eligibility check. Performance track (build order item 9):
 * pick a goal once, then start a workout from the matching template — no phase-gating, no engine.
 */
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const fetchMe = () => {
    if (!user) return;
    apiFetch<MeResponse>(user, '/users/me')
      .then(setMe)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchMe, [user]);

  const retry = () => {
    setLoading(true);
    setLoadError(false);
    fetchMe();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleStartWorkout = async (programInstanceId: string) => {
    if (!user) return;
    setStartingWorkout(true);
    try {
      const { sessionLogId } = await apiFetch<{ sessionLogId: string }>(user, '/session-logs/start-performance-session', {
        method: 'POST',
        body: { programInstanceId },
      });
      router.push({ pathname: '/session', params: { programInstanceId, sessionLogId, track: 'PERFORMANCE' } });
    } finally {
      setStartingWorkout(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.spinner} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.body}>Could not load your account. Please check your connection and try again.</Text>
        <PrimaryButton label="Retry" onPress={retry} />
        <Text style={styles.logout} onPress={handleLogout}>
          Log out (dev)
        </Text>
      </SafeAreaView>
    );
  }

  const injuryProfile = me?.injuryProfiles[0];
  const recoveryInstance = me?.activeProgramInstances.find((i) => i.track === 'RECOVERY');
  const performanceInstance = me?.activeProgramInstances.find((i) => i.track === 'PERFORMANCE');
  // An active PERFORMANCE instance always wins, even if an injuryProfile exists — that's exactly
  // what "graduated" means (build order item 9). Without this check, a graduated user would still
  // see recovery-track UI (injuryProfile never goes away) and clicking "Start today's session"
  // would silently re-enroll them in recovery Phase 1 via ensureActiveRecoveryInstance.
  const showRecoveryTrack = !performanceInstance && !!injuryProfile;
  const canStartRecoverySession = showRecoveryTrack && !me?.requiresClearanceConfirmation;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome{me?.profile?.firstName ? `, ${me.profile.firstName}` : ''}</Text>

      {showRecoveryTrack ? (
        me?.requiresClearanceConfirmation ? (
          <>
            <Disclaimer />
            <Text style={styles.blocked}>
              Recovery content is hidden until your exercise clearance is confirmed. You can update
              this once your provider confirms it, or if you meant to answer differently.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.body}>
              Your recovery track is set up. Today&apos;s session runs the red-flag safety check first,
              then your prescribed exercises, then checks whether you&apos;re ready for the next phase.
            </Text>
            {canStartRecoverySession && (
              <PrimaryButton
                label="Start today's session"
                onPress={() => router.push({ pathname: '/red-flag-check', params: { injuryProfileId: injuryProfile.id } })}
              />
            )}
            {canStartRecoverySession && (
              <PrimaryButton
                label="Take progress questionnaire"
                onPress={() => router.push({ pathname: '/outcome-assessment', params: { injuryProfileId: injuryProfile.id } })}
              />
            )}
            {canStartRecoverySession && (
              <PrimaryButton label="View progress" onPress={() => router.push('/outcome-trend')} />
            )}
            {recoveryInstance && (
              <PrimaryButton
                label="Graduate to performance track"
                onPress={() =>
                  router.push({ pathname: '/performance-goal', params: { graduateFromInstanceId: recoveryInstance.id } })
                }
              />
            )}
          </>
        )
      ) : performanceInstance ? (
        <>
          <Text style={styles.body}>
            Your {performanceInstance.performanceGoal?.toLowerCase()} program is set up.
          </Text>
          <PrimaryButton
            label={startingWorkout ? 'Starting…' : "Start today's workout"}
            onPress={() => handleStartWorkout(performanceInstance.id)}
            disabled={startingWorkout}
          />
        </>
      ) : (
        <>
          <Text style={styles.body}>Choose a goal to get your general fitness program.</Text>
          <PrimaryButton label="Choose your goal" onPress={() => router.push('/performance-goal')} />
        </>
      )}

      <Text style={styles.logout} onPress={() => router.push('/accept-invite')}>
        Have an org invite token?
      </Text>
      <Text style={styles.logout} onPress={handleLogout}>
        Log out (dev)
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#111' },
  body: { fontSize: 15, color: '#333', marginBottom: 16 },
  blocked: { fontSize: 15, color: '#8A5A00' },
  spinner: { marginTop: 40 },
  logout: { marginTop: 40, color: '#2A6DF4', fontSize: 15 },
});
