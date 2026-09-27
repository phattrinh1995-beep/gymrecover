import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import type { AdminExercise, AdminPerformanceProgramTemplate } from '../types';

export function AdminPerformanceProgramDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { user } = useAuth();
  const [template, setTemplate] = useState<AdminPerformanceProgramTemplate | null>(null);
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const load = () => {
    if (!user || !templateId) return;
    apiFetch<AdminPerformanceProgramTemplate>(user, `/admin/performance-programs/${templateId}`).then(setTemplate);
    apiFetch<AdminExercise[]>(user, '/admin/exercises').then(setExercises);
  };

  useEffect(load, [user, templateId]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const updateField = (field: keyof AdminPerformanceProgramTemplate, value: string | boolean) =>
    runAction(() =>
      apiFetch(user!, `/admin/performance-programs/${templateId}`, { method: 'PATCH', body: { [field]: value } }),
    );

  const addExercise = () =>
    runAction(() =>
      apiFetch(user!, `/admin/performance-programs/${templateId}/exercises`, {
        method: 'POST',
        body: {
          exerciseId,
          order: (template?.exercises?.length ?? 0) + 1,
          sets: sets ? Number(sets) : undefined,
          reps: reps ? Number(reps) : undefined,
        },
      }),
    );

  const removeExercise = (id: string) =>
    runAction(() => apiFetch(user!, `/admin/performance-program-exercises/${id}`, { method: 'DELETE' }));

  if (!template) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <p>
        <Link to="/admin/performance-programs">&larr; Back to performance programs</Link>
      </p>
      <h1>{template.name}</h1>
      {error && <p className="error">{error}</p>}

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Details</h2>
        <label>
          Description
          <input
            defaultValue={template.description ?? ''}
            onBlur={(e) => e.target.value !== (template.description ?? '') && updateField('description', e.target.value)}
          />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={template.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
          />
          Active (offered to new performance-track sign-ups)
        </label>
      </div>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Exercises</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Sets</th>
              <th>Reps</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {template.exercises?.map((pe) => (
              <tr key={pe.id}>
                <td>{pe.exercise.name}</td>
                <td>{pe.sets ?? '—'}</td>
                <td>{pe.reps ?? '—'}</td>
                <td>
                  <button className="link-button" onClick={() => removeExercise(pe.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="inline-form">
          <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            <option value="">Add exercise…</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <input placeholder="Sets" value={sets} onChange={(e) => setSets(e.target.value)} style={{ maxWidth: 80 }} />
          <input placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} style={{ maxWidth: 80 }} />
          <button disabled={!exerciseId} onClick={addExercise}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
