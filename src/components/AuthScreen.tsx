import { useState, type FormEvent } from 'react';
import { authService, type AuthedUser } from '../services/auth.service';
import logoUrl from '../../Assets/mahjup-logo-green.svg';

type AuthMode = 'login' | 'register';

interface Props {
  onAuthenticated: (user: AuthedUser) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

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
        <img src={logoUrl} alt="MahjUp" className="auth-logo" />

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
            <label className="auth-label" htmlFor="auth-username">Email Address</label>
            <input
              id="auth-username"
              type="email"
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your email"
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
