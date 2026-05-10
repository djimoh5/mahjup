import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { authService, type AuthedUser } from '../services/auth.service';
import logoUrl from '../../Assets/mahjup-logo-green.svg';

type AuthMode = 'login' | 'register' | 'code-request' | 'code-verify' | 'reset-request' | 'reset-confirm' | 'reset-done';

const BACK_MAP: Partial<Record<AuthMode, AuthMode>> = {
  'code-request': 'login',
  'code-verify': 'code-request',
  'reset-request': 'login',
  'reset-confirm': 'reset-request',
  'reset-done': 'login',
};

interface Props {
  onAuthenticated: (user: AuthedUser) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
    setCode('');
    setNewPassword('');
  }

  function goBack() {
    const prev = BACK_MAP[mode];
    if (prev) switchMode(prev);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'login') {
      const result = await authService.login(username, password);
      setIsLoading(false);
      if (result.user) {
        onAuthenticated(result.user);
      } else {
        setError(result.error ?? 'Something went wrong');
      }
    } else if (mode === 'register') {
      const result = await authService.register(username, password);
      setIsLoading(false);
      if (result.user) {
        onAuthenticated(result.user);
      } else {
        setError(result.error ?? 'Something went wrong');
      }
    } else if (mode === 'code-request') {
      const result = await authService.requestLoginCode(username);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        switchMode('code-verify');
      }
    } else if (mode === 'code-verify') {
      const result = await authService.verifyLoginCode(username, code);
      setIsLoading(false);
      if (result.user) {
        onAuthenticated(result.user);
      } else {
        setError(result.error ?? 'Something went wrong');
      }
    } else if (mode === 'reset-request') {
      const result = await authService.requestPasswordReset(username);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        switchMode('reset-confirm');
      }
    } else if (mode === 'reset-confirm') {
      const result = await authService.confirmPasswordReset(username, code, newPassword);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        switchMode('reset-done');
      }
    }
  }

  const showToggle = mode === 'login' || mode === 'register';
  const showBack = mode in BACK_MAP;

  const TITLES: Partial<Record<AuthMode, string>> = {
    'code-request': 'Sign In with Code',
    'code-verify': 'Enter Your Code',
    'reset-request': 'Reset Password',
    'reset-confirm': 'Set New Password',
  };

  const SUBTITLES: Partial<Record<AuthMode, string>> = {
    'code-verify': `We sent a 6-digit code to ${username}`,
    'reset-confirm': `We sent a 6-digit code to ${username}`,
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Paper
        sx={{
          width: '100%',
          maxWidth: 420,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.2)',
          p: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <img src={logoUrl} alt="MahjUp" style={{ width: 300, borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />

        {showBack && (
          <Box sx={{ width: '100%' }}>
            <Button
              onClick={goBack}
              size="small"
              sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', px: 0, '&:hover': { background: 'transparent', color: 'text.primary' } }}
            >
              ← Back
            </Button>
          </Box>
        )}

        {showToggle && (
          <Box sx={{ display: 'flex', width: '100%', background: 'rgba(46,94,66,0.1)', borderRadius: '0.75rem', p: '0.25rem', gap: '0.25rem' }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <Button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                fullWidth
                sx={{
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: mode === m ? 'primary.main' : 'text.secondary',
                  background: mode === m ? 'white' : 'transparent',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </Button>
            ))}
          </Box>
        )}

        {TITLES[mode] && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {TITLES[mode]}
            </Typography>
            {SUBTITLES[mode] && (
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
                {SUBTITLES[mode]}
              </Typography>
            )}
          </Box>
        )}

        {mode === 'reset-done' ? (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success" variant="outlined" sx={{ borderRadius: '0.75rem', fontSize: '0.875rem' }}>
              Your password has been reset. You can now sign in.
            </Alert>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => switchMode('login')}
              sx={{ py: '0.875rem', fontSize: '1rem', borderRadius: '0.75rem' }}
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Email field — shown on all steps except code-verify and reset-confirm */}
            {mode !== 'code-verify' && mode !== 'reset-confirm' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography component="label" htmlFor="auth-username" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Email Address
                </Typography>
                <TextField
                  id="auth-username"
                  type="email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="username"
                  autoFocus
                  fullWidth
                />
              </Box>
            )}

            {/* Password field — login and register only */}
            {(mode === 'login' || mode === 'register') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography component="label" htmlFor="auth-password" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Password
                </Typography>
                <TextField
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  fullWidth
                />
              </Box>
            )}

            {/* Code field — code-verify and reset-confirm */}
            {(mode === 'code-verify' || mode === 'reset-confirm') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography component="label" htmlFor="auth-code" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  6-Digit Code
                </Typography>
                <TextField
                  id="auth-code"
                  type="text"
                  slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' } }}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  fullWidth
                />
              </Box>
            )}

            {/* New password field — reset-confirm only */}
            {mode === 'reset-confirm' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography component="label" htmlFor="auth-new-password" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  New Password
                </Typography>
                <TextField
                  id="auth-new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                  fullWidth
                />
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
                  Password must be 8+ characters and include an uppercase letter,
                  a number, and a special character (!@#$%,-+*(){}/_&amp;).
                </Typography>
              </Box>
            )}

            {mode === 'register' && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
                Password must be 8+ characters and include an uppercase letter,
                a number, and a special character (!@#$%,-+*(){}/_&amp;).
              </Typography>
            )}

            {error && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isLoading}
              sx={{ py: '0.875rem', fontSize: '1rem', borderRadius: '0.75rem', mt: 0.5 }}
            >
              {isLoading ? 'Please wait…' : {
                login: 'Sign In',
                register: 'Create Account',
                'code-request': 'Send Code',
                'code-verify': 'Verify & Sign In',
                'reset-request': 'Send Reset Code',
                'reset-confirm': 'Reset Password',
              }[mode]}
            </Button>

            {mode === 'login' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
                <Button
                  type="button"
                  onClick={() => switchMode('reset-request')}
                  size="small"
                  sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', px: 0, textTransform: 'none', '&:hover': { background: 'transparent', color: 'primary.main' } }}
                >
                  Forgot your password?
                </Button>
                <Button
                  type="button"
                  onClick={() => switchMode('code-request')}
                  size="small"
                  sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', px: 0, textTransform: 'none', '&:hover': { background: 'transparent', color: 'primary.main' } }}
                >
                  Sign in without a password
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
