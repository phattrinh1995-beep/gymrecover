import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import type { AdminExercise } from '../types';

const REGIONS = ['', 'KNEE', 'SHOULDER', 'HIP', 'ANKLE_FOOT', 'SPINE', 'ELBOW_WRIST', 'GENERAL_MUSCLE'];

const emptyForm = {
  name: '',
  description: '',
  region: '',
  equipment: '',
  videoUrl: '',
  imageUrl: '',
  thumbnailUrl: '',
};

/** Admin CMS (non-functional requirement): the exercise catalog is editable here instead of only
 * via prisma/seed.ts. Restricted server-side to SUPER_ADMIN — see backend/src/admin-cms/. */
export function AdminExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<AdminExercise[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!user) return;
    apiFetch<AdminExercise[]>(user, '/admin/exercises')
      .then(setExercises)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load exercises.'));
  };

  useEffect(load, [user]);

  const startEdit = (ex: AdminExercise) => {
    setEditingId(ex.id);
    setForm({
      name: ex.name,
      description: ex.description ?? '',
      region: ex.region ?? '',
      equipment: ex.equipment ?? '',
      videoUrl: ex.videoUrl ?? '',
      imageUrl: ex.imageUrl ?? '',
      thumbnailUrl: ex.thumbnailUrl ?? '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!user || !form.name.trim()) return;
    setBusy(true);
    setError(null);
    const body = {
      name: form.name,
      description: form.description || undefined,
      region: form.region || undefined,
      equipment: form.equipment || undefined,
      videoUrl: form.videoUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
    };
    try {
      if (editingId) {
        await apiFetch(user, `/admin/exercises/${editingId}`, { method: 'PATCH', body });
      } else {
        await apiFetch(user, '/admin/exercises', { method: 'POST', body });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!user) return;
    setError(null);
    try {
      await apiFetch(user, `/admin/exercises/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="page">
      <p>
        <Link to="/admin">&larr; Back to protocol templates</Link> ·{' '}
        <Link to="/admin/performance-programs">Performance programs</Link>
      </p>
      <h1>Exercise catalog</h1>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>{editingId ? 'Edit exercise' : 'New exercise'}</h2>
        <div className="inline-form">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r || 'No region'}
              </option>
            ))}
          </select>
          <input
            placeholder="Equipment"
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
          />
        </div>
        <div className="inline-form">
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="inline-form">
          <input
            placeholder="Video URL"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
          <input
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="inline-form">
          <button disabled={busy || !form.name.trim()} onClick={save}>
            {editingId ? 'Save changes' : 'Create exercise'}
          </button>
          {editingId && (
            <button className="link-button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Region</th>
            <th>Equipment</th>
            <th>Media</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {exercises?.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.name}</td>
              <td>{ex.region ?? '—'}</td>
              <td>{ex.equipment ?? '—'}</td>
              <td>{ex.videoUrl || ex.imageUrl ? 'Yes' : 'No demo media yet'}</td>
              <td>
                <button className="link-button" onClick={() => startEdit(ex)}>
                  Edit
                </button>{' '}
                <button className="link-button" onClick={() => remove(ex.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
