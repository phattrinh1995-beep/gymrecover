import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiFetch } from '../api/client';
import type { PatientSummary } from '../types';

export function PatientsListPage() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch<PatientSummary[]>(user, '/provider/patients')
      .then(setPatients)
      .catch(() => setError(true));
  }, [user]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Your patients</h1>
        <div>
          <Link to="/organization" style={{ marginRight: 16 }}>
            Organization
          </Link>
          <Link to="/admin" style={{ marginRight: 16 }}>
            Admin CMS
          </Link>
          <button className="link-button" onClick={logout}>
            Log out (dev)
          </button>
        </div>
      </header>

      {error && <p className="error">Could not load your patients. Please refresh the page.</p>}
      {!patients && !error && <p>Loading…</p>}
      {patients && patients.length === 0 && (
        <p className="muted">
          No patients are assigned to you yet. Provider/patient assignment (invites) is build order
          item 10 — for this demo, assignments are created via a backend script.
        </p>
      )}
      {patients && patients.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>Current phase</th>
              <th>Sessions this week</th>
              <th>Latest pain</th>
              <th>Latest PROM</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.patientId}>
                <td>
                  <Link to={`/patients/${p.patientId}`}>{p.name}</Link>
                </td>
                <td>{p.region ?? '—'}</td>
                <td>{p.currentPhaseName ?? '—'}</td>
                <td>{p.sessionsThisWeek}</td>
                <td>{p.latestPainScore ?? '—'}</td>
                <td>{p.latestPromScore ?? '—'}</td>
                <td>
                  {p.manualHold && <span className="badge badge-hold">Hold</span>}
                  {p.pendingPhaseId && !p.manualHold && <span className="badge badge-pending">Pending ack</span>}
                  {!p.manualHold && !p.pendingPhaseId && <span className="badge badge-ok">Active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
