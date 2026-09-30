import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiFetch, ApiError } from '../api/client';
import type { AdminExercise, AdminPhase, AdminProtocolTemplate } from '../types';

function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  return (
    <label>
      {label} (JSON)
      <textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setJsonError(null);
          } catch {
            setJsonError('Invalid JSON — not saved until fixed');
          }
        }}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      />
      {jsonError && <span className="error">{jsonError}</span>}
    </label>
  );
}

export function AdminTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { user } = useAuth();
  const [template, setTemplate] = useState<AdminProtocolTemplate | null>(null);
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newPhase, setNewPhase] = useState({
    order: 1,
    name: '',
    entryCriteria: {} as Record<string, unknown>,
    exitCriteria: {} as Record<string, unknown>,
  });

  const load = () => {
    if (!user || !templateId) return;
    apiFetch<AdminProtocolTemplate>(user, `/admin/protocol-templates/${templateId}`)
      .then(setTemplate)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this template.'));
    apiFetch<AdminExercise[]>(user, '/admin/exercises')
      .then(setExercises)
      .catch(() => {
        /* Exercise catalog failing to load only disables the "add exercise" picker below. */
      });
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

  const updateTemplateField = (field: keyof AdminProtocolTemplate, value: string | boolean) =>
    runAction(() => apiFetch(user!, `/admin/protocol-templates/${templateId}`, { method: 'PATCH', body: { [field]: value } }));

  const createPhase = () =>
    runAction(async () => {
      await apiFetch(user!, `/admin/protocol-templates/${templateId}/phases`, { method: 'POST', body: newPhase });
      setNewPhase({ order: (template?.phases?.length ?? 0) + 2, name: '', entryCriteria: {}, exitCriteria: {} });
    });

  const deletePhase = (id: string) => runAction(() => apiFetch(user!, `/admin/phases/${id}`, { method: 'DELETE' }));

  if (!template) {
    return (
      <div className="page">
        {error ? <p className="error">{error}</p> : <p>Loading…</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin">&larr; Back to protocol templates</Link>
      </p>
      <h1>{template.name}</h1>
      {error && <p className="error">{error}</p>}

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Template details</h2>
        <label>
          Reviewed by
          <input
            defaultValue={template.reviewedBy}
            onBlur={(e) => e.target.value !== template.reviewedBy && updateTemplateField('reviewedBy', e.target.value)}
          />
        </label>
        <label>
          Source citation
          <input
            defaultValue={template.sourceCitation ?? ''}
            onBlur={(e) =>
              e.target.value !== (template.sourceCitation ?? '') && updateTemplateField('sourceCitation', e.target.value)
            }
          />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={template.isActive}
            onChange={(e) => updateTemplateField('isActive', e.target.checked)}
          />
          Active (shown to new program enrollments)
        </label>
      </div>

      <h2>Phases</h2>
      {template.phases?.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          exercises={exercises}
          onChanged={load}
          onError={setError}
          onDelete={() => deletePhase(phase.id)}
        />
      ))}

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Add phase</h2>
        <div className="inline-form">
          <input
            type="number"
            placeholder="Order"
            value={newPhase.order}
            onChange={(e) => setNewPhase({ ...newPhase, order: Number(e.target.value) })}
            style={{ maxWidth: 80 }}
          />
          <input
            placeholder="Phase name"
            value={newPhase.name}
            onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
          />
        </div>
        <JsonField
          label="Entry criteria"
          value={newPhase.entryCriteria}
          onChange={(v) => setNewPhase({ ...newPhase, entryCriteria: v })}
        />
        <JsonField
          label="Exit criteria"
          value={newPhase.exitCriteria}
          onChange={(v) => setNewPhase({ ...newPhase, exitCriteria: v })}
        />
        <button disabled={!newPhase.name.trim()} onClick={createPhase}>
          Add phase
        </button>
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  exercises,
  onChanged,
  onError,
  onDelete,
}: {
  phase: AdminPhase;
  exercises: AdminExercise[];
  onChanged: () => void;
  onError: (msg: string) => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Action failed.');
    }
  };

  const addExercise = () =>
    run(() =>
      apiFetch(user!, `/admin/phases/${phase.id}/exercises`, {
        method: 'POST',
        body: {
          exerciseId,
          order: phase.phaseExercises.length + 1,
          sets: sets ? Number(sets) : undefined,
          reps: reps ? Number(reps) : undefined,
        },
      }),
    );

  const removeExercise = (id: string) => run(() => apiFetch(user!, `/admin/phase-exercises/${id}`, { method: 'DELETE' }));

  return (
    <div className="card" style={{ maxWidth: 'none' }}>
      <h3>
        {phase.order}. {phase.name}
      </h3>
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
          {phase.phaseExercises.map((pe) => (
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
      <button className="link-button" onClick={onDelete}>
        Delete this phase
      </button>
    </div>
  );
}
