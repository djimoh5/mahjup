import { useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { adminService } from '../services/admin.service';
import logoUrl from '../../Assets/mahjup-logo-dark.png';
import bgUrl from '../../Assets/mahjong-table-backround.png';

interface Props {
  onAuthenticated: () => void;
}

export default function AdminLoginScreen({ onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await adminService.login(email, password);
    setIsLoading(false);
    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error ?? 'Something went wrong');
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, backgroundImage: `linear-gradient(rgba(255,240,238,0.6), rgba(255,240,238,0.6)), url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
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
        <img src={logoUrl} alt="MahjUp" style={{ width: 260 }} />

        <Chip
          label="ADMIN PORTAL"
          size="small"
          sx={{
            background: 'rgba(30,30,30,0.9)',
            color: '#fff',
            fontWeight: 700,
            letterSpacing: '0.05em',
            fontSize: '0.65rem',
            border: 'none',
          }}
        />

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component="label" htmlFor="admin-email" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Email Address
            </Typography>
            <TextField
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              autoComplete="username"
              autoFocus
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component="label" htmlFor="admin-password" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              Password
            </Typography>
            <TextField
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
              fullWidth
            />
          </Box>

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
            {isLoading ? 'Please wait…' : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
