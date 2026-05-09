import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { authService, type AuthedUser } from '../services/auth.service';
import logoUrl from '../../Assets/mahjup-logo-green.svg';

interface Props {
  code: string;
  onAuthenticated: (user: AuthedUser) => void;
}

export default function InviteRedeemScreen({ code, onAuthenticated }: Props) {
  const [error, setError] = useState('');

  useEffect(() => {
    authService.redeemInvite(code).then(({ user, error }) => {
      if (user) {
        onAuthenticated(user);
      } else {
        setError(error ?? 'Invalid or expired invite link');
      }
    });
  }, [code]);

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

        {!error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Accepting your invite…</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '0.75rem' }}>
              {error}
            </Alert>
            <Button variant="outlined" fullWidth href="/" sx={{ borderRadius: '0.75rem' }}>
              Go to Sign In
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
