import { useState, type FormEvent } from 'react';
import { authService, type AuthedUser } from '../services/auth.service';

type AuthMode = 'login' | 'register';

interface Props {
  onAuthenticated: (user: AuthedUser) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    setConfirmPassword('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = mode === 'login'
      ? await authService.login(username, password)
      : await authService.register(username, password);
    setIsLoading(false);

    if (result.user) {
      onAuthenticated(result.user);
    } else {
      setError(result.error ?? 'Something went wrong');
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-logo">🀄</div>
        <h1 className="auth-title">Mahjong Tracker</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === 'login' ? ' auth-tab-active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab${mode === 'register' ? ' auth-tab-active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-confirm">Confirm Password</label>
                <input
                  id="auth-confirm"
                  type="password"
                  className="auth-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <p className="auth-hint">
                Password must be 8+ characters and include an uppercase letter,
                a number, and a special character (!@#$%,-+*()&#123;&#125;/_&amp;).
              </p>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
