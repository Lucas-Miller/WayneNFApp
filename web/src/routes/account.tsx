// routes/account.tsx

import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, CircleUserRound, LogOut, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDeleteSpot, useSpots } from '@/hooks/useSpots';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/account')({
  component: AccountScreen,
});

function AccountScreen() {
  const { token } = useAuth();

  return (
    <div className="page">
      <div className="card page-card">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Back to map
        </Link>
        {token ? <SpotsList /> : <AuthForm />}
      </div>
    </div>
  );
}

function AuthForm() {
  const { login, signup, sessionExpired } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(sessionExpired ? 'Session expired' : null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await (mode === 'login' ? login : signup)({ email, password });
    } catch (err) {
      if (mode === 'login') {
        setError('Invalid credentials');
      } else {
        setError(err instanceof ApiError && err.status === 409 ? 'Email already in use' : 'Sign up failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      {error && <p className="error">{error}</p>}
      <input
        className="input"
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Please wait…' : mode === 'login' ? 'Login' : 'Sign Up'}
      </button>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
        }}
      >
        {mode === 'login' ? 'No account? Sign up' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}

function SpotsList() {
  const { user, logout } = useAuth();
  const { data: spots = [], isLoading, error } = useSpots();
  const deleteSpot = useDeleteSpot();

  return (
    <>
      <div className="account-header">
        <CircleUserRound size={44} />
        <span className="account-email">{user?.email ?? '…'}</span>
        <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out">
          <LogOut size={24} />
        </button>
      </div>

      <h3 className="section-title">Saved spots</h3>

      {isLoading ? (
        <p className="muted center">Loading…</p>
      ) : error ? (
        <p className="error center">Could not load spots</p>
      ) : spots.length === 0 ? (
        <p className="muted center">No saved spots yet — click the map to save one.</p>
      ) : (
        <ul className="spot-list">
          {spots.map((spot) => (
            <li key={spot.id} className="spot">
              <Link
                to="/"
                search={{ destLat: spot.latitude, destLng: spot.longitude }}
                className="spot-link"
              >
                <MapPin size={20} className="accent" />
                <div>
                  <div className="spot-name">{spot.name}</div>
                  <div className="muted">
                    {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                  </div>
                </div>
              </Link>
              <button
                className="icon-btn danger"
                title="Delete spot"
                aria-label={`Delete ${spot.name}`}
                disabled={deleteSpot.isPending && deleteSpot.variables === spot.id}
                onClick={() => {
                  if (confirm(`Delete "${spot.name}"?`)) deleteSpot.mutate(spot.id);
                }}
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
