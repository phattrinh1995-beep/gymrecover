import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import type { PatientDetail, RedFlagAlert } from '../types';

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [alerts, setAlerts] = useState<RedFlagAlert[]>([]);
  const [holdReason, setHoldReason] = useState('');
  const [advanceTarget, setAdvanceTarget] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user || !patientId) return;
    apiFetch<PatientDetail>(user, `/provider/patients/${patientId}`).then(setPatient);
    apiFetch<RedFlagAlert[]>(user, `/provider/patients/${patientId}/red-flag-alerts`).then(setAlerts);
  };

  useEffect(load, [user, patientId]);

  const instance = patient?.programInstances.find((pi) => pi.track === 'RECOVERY' && pi.status === 'ACTIVE');

  const runAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const placeHold = () =>
    runAction(() =>
      apiFetch(user!, `/provider/patients/${patientId}/program-instances/${instance!.id}/hold`, {
        method: 'POST',
        body: { reason: holdReason },
      }),
    );

  const releaseHold = () =>
    runAction(() =>
      apiFetch(user!, `/provider/patients/${patientId}/program-instances/${instance!.id}/release-hold`, {
        method: 'POST',
      }),
    );

  const manuallyAdvance = () =>
    runAction(() =>
      apiFetch(user!, `/provider/patients/${patientId}/program-instances/${instance!.id}/advance`, {
        method: 'POST',
        body: { targetPhaseId: advanceTarget, reason: advanceReason },
      }),
    );

  const acknowledgeAsProvider = () =>
    runAction(() =>
      apiFetch(user!, `/program-engine/instances/${instance!.id}/acknowledge`, { method: 'POST' }),
    );

  if (!patient) return <div className="page">Loading…</div>;

  const injury = patient.injuryProfiles[0];
  const phases = instance?.currentPhase?.protocolTemplate.phases ?? [];

  return (
    <div className="page">
      <p>
        <Link to="/patients">&larr; Back to patients</Link>
      </p>
      <h1>
        {patient.profile ? `${patient.profile.firstName} ${patient.profile.lastName}` : patient.email}
      </h1>
      <p className="muted">{patient.email}</p>

      {alerts.length > 0 && (
        <div className="card card-alert">
          <h2>Red-flag alerts</h2>
          {alerts.map((a) => (
            <div key={a.id} className="alert-row">
              <strong>{new Date(a.createdAt).toLocaleString()}</strong>
              <span>
                {Object.entries(a.redFlagDetails)
                  .filter(([k, v]) => v === true && k !== 'notifiedProviderIds')
                  .map(([k]) => k)
                  .join(', ') || 'symptoms reported'}
              </span>
            </div>
          ))}
        </div>
      )}

      {injury && (
        <div className="card">
          <h2>Injury</h2>
          <p>
            {injury.region} ({injury.side}) — clearance: {injury.clearanceStatus}
          </p>
          {injury.surgeryType && (
            <p>
              Surgery: {injury.surgeryType} on {injury.surgeryDate?.slice(0, 10)}
            </p>
          )}
        </div>
      )}

      {instance && (
        <div className="card">
          <h2>Program</h2>
          <p>
            Current phase: <strong>{instance.currentPhase?.name ?? '—'}</strong>
          </p>
          {instance.manualHold && (
            <p className="warning">Hold in place: {instance.manualHoldReason}</p>
          )}
          {instance.pendingPhaseId && (
            <div className="warning-box">
              <p>Patient has been flagged eligible to advance and is awaiting acknowledgment.</p>
              <button disabled={busy} onClick={acknowledgeAsProvider}>
                Acknowledge advancement
              </button>
            </div>
          )}
          {error && <p className="error">{error}</p>}

          <div className="controls-row">
            {instance.manualHold ? (
              <button disabled={busy} onClick={releaseHold}>
                Release hold
              </button>
            ) : (
              <div className="inline-form">
                <input
                  placeholder="Reason for hold"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                />
                <button disabled={busy || holdReason.trim().length < 3} onClick={placeHold}>
                  Place hold
                </button>
              </div>
            )}
          </div>

          <div className="inline-form">
            <select value={advanceTarget} onChange={(e) => setAdvanceTarget(e.target.value)}>
              <option value="">Manually set phase…</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.order}. {p.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Reason for manual change"
              value={advanceReason}
              onChange={(e) => setAdvanceReason(e.target.value)}
            />
            <button
              disabled={busy || !advanceTarget || advanceReason.trim().length < 3}
              onClick={manuallyAdvance}
            >
              Apply
            </button>
          </div>

          <h3>Recent sessions</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Completed</th>
                <th>Pain</th>
                <th>RPE</th>
                <th>Red flag</th>
              </tr>
            </thead>
            <tbody>
              {instance.sessionLogs.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.completed ? 'Yes' : 'No'}</td>
                  <td>{s.painScore ?? '—'}</td>
                  <td>{s.rpe ?? '—'}</td>
                  <td>{s.redFlagTriggered ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>PROM history ({instance.outcomeAssessments[0]?.type ?? 'none yet'})</h3>
          {instance.outcomeAssessments.length === 0 ? (
            <p className="muted">No assessments logged yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {instance.outcomeAssessments.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.assessedAt).toLocaleDateString()}</td>
                    <td>{o.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
