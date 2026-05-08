import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
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

        {/* Mode toggle */}
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

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          {mode === 'register' && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
              Password must be 8+ characters and include an uppercase letter,
              a number, and a special character (!@#$%,-+*()&#123;&#125;/_&amp;).
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
            {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
