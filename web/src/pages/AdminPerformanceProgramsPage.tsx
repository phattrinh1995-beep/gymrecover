import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import type { AdminPerformanceProgramTemplate } from '../types';

const GOALS = ['STRENGTH', 'HYPERTROPHY', 'CONDITIONING'] as const;

/** Admin CMS extension: the performance-track templates from build order item 9 are ordinary
 * general-fitness programming, not clinical content, but were still only editable via
 * prisma/seed.ts until now — same CRUD pattern as the rehab protocol templates. */
export function AdminPerformanceProgramsPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AdminPerformanceProgramTemplate[] | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<(typeof GOALS)[number]>('STRENGTH');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    apiFetch<AdminPerformanceProgramTemplate[]>(user, '/admin/performance-programs')
      .then((t) => {
        setTemplates(t);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load performance programs.'));
  };

  useEffect(load, [user]);

  const create = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, '/admin/performance-programs', { method: 'POST', body: { name, goal } });
      setName('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the program.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <p>
        <Link to="/admin">Rehab protocols</Link> · <Link to="/admin/exercises">Exercise catalog</Link> ·{' '}
        <Link to="/patients">Back to patients</Link>
      </p>
      <h1>Performance program templates</h1>
      <p className="muted">General strength/hypertrophy/conditioning templates — not clinical content.</p>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>New program template</h2>
        <div className="inline-form">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button disabled={busy || !name.trim()} onClick={create}>
            Create
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {loadError && <p className="error">{loadError}</p>}
      {!templates && !loadError && <p>Loading…</p>}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Goal</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {templates?.map((t) => (
            <tr key={t.id}>
              <td>
                <Link to={`/admin/performance-programs/${t.id}`}>{t.name}</Link>
              </td>
              <td>{t.goal}</td>
              <td>{t.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
