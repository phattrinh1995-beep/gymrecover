import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    login(email);
    navigate('/patients');
  };

  return (
    <div className="centered-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>GymRecover Provider Portal</h1>
        <p className="muted">
          Dev preview: no real Auth0 tenant is connected yet, so this creates a local demo provider
          session from your email. Assign yourself to patients via the backend seed/test scripts —
          see PROGRESS.md.
        </p>
        <label>
          Provider email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="provider@example.com" />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
