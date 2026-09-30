import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiFetch } from '../api/client';
import type { Organization, OrgInvite } from '../types';

/**
 * Org/admin basics (build order item 10): create an org, invite providers/members, view the
 * roster and a stub subscription record. No real payment processing is integrated (explicitly out
 * of scope until asked), and no real email delivery exists yet — an invite's token is shown
 * directly here for the admin to share manually (see backend/src/organizations/organizations.service.ts).
 */
export function OrganizationPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null | undefined>(undefined);
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'PROVIDER' | 'MEMBER'>('PROVIDER');
  const [lastInvite, setLastInvite] = useState<OrgInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    apiFetch<Organization | null>(user, '/organizations/mine')
      .then(setOrg)
      .catch(() => setError('Could not load your organization. Please refresh the page.'));
  };

  useEffect(load, [user]);

  const createOrg = async () => {
    if (!user || orgName.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, '/organizations', { method: 'POST', body: { name: orgName, type: 'GYM' } });
      load();
    } catch {
      setError('Could not create the organization.');
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    if (!user || !org || !inviteEmail.includes('@')) return;
    setBusy(true);
    setError(null);
    try {
      const invite = await apiFetch<OrgInvite>(user, `/organizations/${org.id}/invites`, {
        method: 'POST',
        body: { email: inviteEmail, role: inviteRole },
      });
      setLastInvite(invite);
      setInviteEmail('');
      load();
    } catch {
      setError('Could not create the invite.');
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!user) return;
    await apiFetch(user, `/organizations/invites/${inviteId}/revoke`, { method: 'POST' });
    load();
  };

  if (org === undefined) {
    return (
      <div className="page">
        {error ? <p className="error">{error}</p> : <p>Loading…</p>}
      </div>
    );
  }

  if (org === null) {
    return (
      <div className="page">
        <p>
          <Link to="/patients">&larr; Back to patients</Link>
        </p>
        <h1>Create your organization</h1>
        <p className="muted">
          Set up a gym or clinic organization so you can invite other providers and members.
        </p>
        <div className="inline-form">
          <input placeholder="Organization name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          <button disabled={busy || orgName.trim().length < 2} onClick={createOrg}>
            Create
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to="/patients">&larr; Back to patients</Link>
      </p>
      <h1>{org.name}</h1>
      <p className="muted">{org.type}</p>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Subscription</h2>
        <p className="muted">
          Stub only — no real payment processing is integrated yet.
        </p>
        <p>
          Plan: <strong>{org.subscription?.plan}</strong> · Status: <strong>{org.subscription?.status}</strong> ·
          Seats: <strong>{org.subscription?.seats}</strong>
        </p>
      </div>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Members</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {org.users.map((m) => (
              <tr key={m.id}>
                <td>{m.email}</td>
                <td>{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ maxWidth: 'none' }}>
        <h2>Invite a provider or member</h2>
        <p className="muted">
          No email service is configured yet, so accepting an invite means sharing the token below
          with the invitee directly — they enter it after signing in.
        </p>
        <div className="inline-form">
          <input placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'PROVIDER' | 'MEMBER')}>
            <option value="PROVIDER">Provider</option>
            <option value="MEMBER">Member</option>
          </select>
          <button disabled={busy || !inviteEmail.includes('@')} onClick={sendInvite}>
            Create invite
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        {lastInvite && (
          <p className="warning-box">
            Invite token for {lastInvite.email}: <code>{lastInvite.token}</code>
          </p>
        )}

        <h3>Pending invites</h3>
        {org.invites.length === 0 ? (
          <p className="muted">No invites yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {org.invites.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{inv.status}</td>
                  <td>
                    {inv.status === 'PENDING' && (
                      <button className="link-button" onClick={() => revokeInvite(inv.id)}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
