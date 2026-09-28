import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OptionButton, PrimaryButton } from '../components/OptionButton';
import { RestTimer } from '../components/RestTimer';
import { ScalePicker } from '../components/ScalePicker';
import { Disclaimer } from '../components/Disclaimer';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import type { PhaseExercise, TodaySessionResponse } from '../types';

interface CriterionResult {
  key: string;
  met: boolean;
  reason: string;
}
interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  results: CriterionResult[];
  nextPhase: { id: string; name: string } | null;
}
interface EngineStatus {
  pendingPhaseId: string | null;
  providerRequired: boolean;
  userAcknowledgedAt: string | null;
  providerAcknowledgedAt: string | null;
}

/**
 * Session execution UI (build order item 6): today's exercises with sets/reps/hold-time, per-
 * exercise completion, rest timers, RPE + pain score logging. After finishing, calls the Adaptive
 * Program Engine (milestone 5) exactly the way that milestone specifies, and surfaces any
 * phase-advancement eligibility as an explicit in-app prompt.
 */
export default function SessionScreen() {
  const { programInstanceId, sessionLogId, track } = useLocalSearchParams<{
    programInstanceId: string;
    sessionLogId: string;
    track?: string;
  }>();
  const isPerformanceTrack = track === 'PERFORMANCE';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [session, setSession] = useState<TodaySessionResponse | null>(null);
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [restingId, setRestingId] = useState<string | null>(null);
  const [painScore, setPainScore] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    if (!user || !programInstanceId) return;
    apiFetch<TodaySessionResponse>(user, `/program-instances/${programInstanceId}/today-session`)
      .then(setSession)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [user, programInstanceId]);

  const markComplete = (phaseExerciseId: string) => {
    setCompletedIds((prev) => ({ ...prev, [phaseExerciseId]: true }));
    setRestingId(phaseExerciseId);
  };

  const allExercisesDone =
    !session || session.phaseExercises.length === 0 || session.phaseExercises.every((pe) => completedIds[pe.id]);

  const handleFinishSession = async (overrides?: { painScore: number; rpe: number }) => {
    const finalPainScore = overrides?.painScore ?? painScore;
    const finalRpe = overrides?.rpe ?? rpe;
    if (!user || !sessionLogId || finalPainScore === null || finalRpe === null || !session) return;
    setSubmitting(true);
    try {
      await apiFetch(user, `/session-logs/${sessionLogId}/complete`, {
        method: 'PATCH',
        body: {
          painScore: finalPainScore,
          rpe: finalRpe,
          exerciseResults: session.phaseExercises.map((pe) => ({
            phaseExerciseId: pe.id,
            setsCompleted: completedIds[pe.id] ? (pe.sets ?? undefined) : 0,
            repsCompleted: completedIds[pe.id] ? (pe.reps ?? undefined) : 0,
            holdSecondsCompleted: completedIds[pe.id] ? (pe.holdTimeSeconds ?? undefined) : 0,
          })),
        },
      });
      setFinished(true);
      // The Adaptive Program Engine only governs the recovery track's phase gating (build order
      // item 5) — a performance-track workout has no phases/criteria to evaluate.
      if (!isPerformanceTrack) {
        const result = await apiFetch<EligibilityResult>(
          user,
          `/program-engine/instances/${programInstanceId}/check-eligibility`,
          { method: 'POST' },
        );
        setEligibility(result);
        if (result.eligible) {
          const s = await apiFetch<EngineStatus>(user, `/program-engine/instances/${programInstanceId}`);
          setStatus(s);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!user || !programInstanceId) return;
    setAcking(true);
    try {
      const s = await apiFetch<EngineStatus>(user, `/program-engine/instances/${programInstanceId}/acknowledge`, {
        method: 'POST',
      });
      setStatus(s);
    } finally {
      setAcking(false);
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
        <View style={styles.content}>
          <Text style={styles.body}>Could not load today's session. Please check your connection and try again.</Text>
          <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Session logged</Text>
          <Disclaimer />
          {isPerformanceTrack && <Text style={styles.body}>Nice work — your workout has been logged.</Text>}
          {!isPerformanceTrack && !eligibility && <ActivityIndicator style={styles.spinner} />}
          {!isPerformanceTrack && eligibility && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {eligibility.eligible ? 'You may be ready for the next phase' : 'Not yet eligible for the next phase'}
              </Text>
              {eligibility.reason && <Text style={styles.cardBody}>{eligibility.reason}</Text>}
              {eligibility.results.map((r) => (
                <Text key={r.key} style={[styles.criterion, r.met ? styles.criterionMet : styles.criterionUnmet]}>
                  {r.met ? '✓' : '✗'} {r.key}: {r.reason}
                </Text>
              ))}
              {eligibility.eligible && status && !status.userAcknowledgedAt && (
                <>
                  <Text style={styles.cardBody}>
                    This won't change your program automatically.{' '}
                    {status.providerRequired
                      ? 'Confirm below — your assigned provider will also need to confirm before your phase actually changes.'
                      : 'Confirm below to move to the next phase.'}
                  </Text>
                  <PrimaryButton
                    label={acking ? 'Confirming…' : 'Confirm, move to next phase'}
                    onPress={handleAcknowledge}
                    disabled={acking}
                  />
                </>
              )}
              {eligibility.eligible && status?.userAcknowledgedAt && status.providerRequired && (
                <Text style={styles.cardBody}>
                  Confirmed on your end — waiting on your assigned provider to confirm before the phase
                  changes.
                </Text>
              )}
              {eligibility.eligible && status && !status.pendingPhaseId && (
                <Text style={styles.cardBody}>Phase updated.</Text>
              )}
            </View>
          )}
          <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{session?.phaseName ?? "Today's session"}</Text>
        <Disclaimer />

        {(!session || session.phaseExercises.length === 0) && (
          <>
            <Text style={styles.body}>
              {isPerformanceTrack ? 'No exercises are configured for this program yet.' : 'No exercises are assigned for your current phase yet.'}
            </Text>
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Continue'}
              onPress={() => handleFinishSession({ painScore: 0, rpe: 1 })}
              disabled={submitting}
            />
          </>
        )}

        {session?.phaseExercises.map((pe: PhaseExercise) => (
          <View key={pe.id} style={styles.exerciseCard}>
            {pe.exercise.imageUrl ? (
              <Image source={{ uri: pe.exercise.imageUrl }} style={styles.exerciseImage} />
            ) : (
              <View style={styles.exercisePlaceholder}>
                <Text style={styles.exercisePlaceholderText}>No demo media yet</Text>
              </View>
            )}
            <Text style={styles.exerciseName}>{pe.exercise.name}</Text>
            {pe.exercise.description && <Text style={styles.exerciseDescription}>{pe.exercise.description}</Text>}
            <Text style={styles.prescription}>
              {[
                pe.sets ? `${pe.sets} sets` : null,
                pe.reps ? `${pe.reps} reps` : null,
                pe.holdTimeSeconds ? `${pe.holdTimeSeconds}s hold` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'As directed'}
            </Text>
            {pe.notes && <Text style={styles.exerciseNotes}>{pe.notes}</Text>}

            {completedIds[pe.id] ? (
              <Text style={styles.doneLabel}>✓ Done</Text>
            ) : (
              <OptionButton label="Mark complete" onPress={() => markComplete(pe.id)} />
            )}
            {restingId === pe.id && <RestTimer onDone={() => setRestingId(null)} />}
          </View>
        ))}

        {allExercisesDone && session && session.phaseExercises.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How did that feel?</Text>
            <Text style={styles.label}>Rate of perceived exertion (1 = very easy, 10 = maximal effort)</Text>
            <ScalePicker min={1} max={10} value={rpe} onChange={setRpe} />
            <Text style={styles.label}>Pain score (0 = none, 10 = worst pain imaginable)</Text>
            <ScalePicker min={0} max={10} value={painScore} onChange={setPainScore} />
          </View>
        )}

        {session && session.phaseExercises.length > 0 && (
          <PrimaryButton
            label={submitting ? 'Saving…' : 'Finish session'}
            onPress={() => handleFinishSession()}
            disabled={submitting || painScore === null || rpe === null || !allExercisesDone}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  body: { fontSize: 15, color: '#333' },
  spinner: { marginTop: 40 },
  exerciseCard: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  exerciseImage: { width: '100%', height: 140, borderRadius: 6, marginBottom: 10, backgroundColor: '#F0F0F0' },
  exercisePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePlaceholderText: { color: '#999', fontSize: 13 },
  exerciseName: { fontSize: 17, fontWeight: '700', color: '#111' },
  exerciseDescription: { fontSize: 13, color: '#555', marginTop: 4 },
  prescription: { fontSize: 14, color: '#2A6DF4', fontWeight: '600', marginTop: 6 },
  exerciseNotes: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
  doneLabel: { color: '#1E7A34', fontWeight: '700', marginTop: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#F7F9FC',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 8 },
  cardBody: { fontSize: 14, color: '#333', marginVertical: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 8 },
  criterion: { fontSize: 13, marginBottom: 4 },
  criterionMet: { color: '#1E7A34' },
  criterionUnmet: { color: '#8A5A00' },
});
