import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import type { AdminProtocolTemplate } from '../types';

const REGIONS = ['KNEE', 'SHOULDER', 'HIP', 'ANKLE_FOOT', 'SPINE', 'ELBOW_WRIST', 'GENERAL_MUSCLE'];

/** Admin CMS (non-functional requirement): "All rehab content must be editable via a simple
 * internal admin CMS... do not hardcode exercises/phases in application code." Restricted
 * server-side to SUPER_ADMIN — see backend/src/admin-cms/. */
export function AdminTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AdminProtocolTemplate[] | null>(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('KNEE');
  const [reviewedBy, setReviewedBy] = useState('PLACEHOLDER - requires licensed clinical review');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    apiFetch<AdminProtocolTemplate[]>(user, '/admin/protocol-templates')
      .then((t) => {
        setTemplates(t);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load protocol templates.'));
  };

  useEffect(load, [user]);

  const create = async () => {
    if (!user || !name.trim() || !reviewedBy.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, '/admin/protocol-templates', { method: 'POST', body: { name, region, reviewedBy } });
      setName('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the template.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <p>
        <Link to="/patients">&larr; Back to patients</Link> · <Link to="/admin/exercises">Exercise catalog</Link> ·{' '}
        <Link to="/admin/performance-programs">Performance programs</Link>
      </p>
      <h1>Rehab protocol templates</h1>
      <p className="warning-box">
        Every protocol here must carry a real <code>reviewedBy</code> and <code>sourceCitation</code>{' '}
        before it's shown to a real patient — this CMS does not enforce clinical accuracy, only lets
        you edit the content.
      </p>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>New protocol template</h2>
        <div className="inline-form">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-form">
          <input
            placeholder="reviewedBy"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            style={{ flex: 3 }}
          />
          <button disabled={busy || !name.trim() || !reviewedBy.trim()} onClick={create}>
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
            <th>Region</th>
            <th>Reviewed by</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {templates?.map((t) => (
            <tr key={t.id}>
              <td>
                <Link to={`/admin/templates/${t.id}`}>{t.name}</Link>
              </td>
              <td>{t.region}</td>
              <td>{t.reviewedBy.startsWith('PLACEHOLDER') ? '⚠ ' + t.reviewedBy : t.reviewedBy}</td>
              <td>{t.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
