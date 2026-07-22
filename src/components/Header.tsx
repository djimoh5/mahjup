import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type { Tab as AppTab } from '../App';

import { authService } from '../services/auth.service';
import logoUrl from '../../Assets/mahjup-logo-dark.png';

import { UserAuth } from '../../model/auth.model';
import type { UserSummary } from '../../model/user.model';
import type { authid } from '../../model/id.model';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isSaving: boolean;
  user: UserAuth;
  onLogout: () => void;
  onUserUpdate: (updated: UserAuth) => void;
  onUserAdded: (newUser: UserSummary) => void;
}

function getInitials(user: UserAuth): string {
  if (user.profile?.firstName && user.profile?.lastName) {
    return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
  }
  if (user.profile?.firstName) return user.profile.firstName[0].toUpperCase();
  return user.username[0].toUpperCase();
}

function getDisplayName(user: UserAuth): string {
  if (user.profile?.firstName || user.profile?.lastName) {
    return [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ');
  }
  return user.username;
}

export default function Header({ activeTab, onTabChange, isSaving, user, onLogout, onUserUpdate, onUserAdded }: HeaderProps) {

  const hasName = !!(user.profile?.firstName || user.profile?.lastName);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [firstName, setFirstName] = useState(user.profile?.firstName ?? '');
  const [lastName, setLastName] = useState(user.profile?.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    if (!hasName) {
      setAccountOpen(true);
    }
  }, []);

  function handleOpenMenu(e: React.MouseEvent<HTMLElement>) {
    setMenuAnchor(e.currentTarget);
  }

  function handleCloseMenu() {
    setMenuAnchor(null);
  }

  function handleOpenAccount() {
    setFirstName(user.profile?.firstName ?? '');
    setLastName(user.profile?.lastName ?? '');
    setError('');
    setAccountOpen(true);
    handleCloseMenu();
  }

  function handleCloseAccount() {
    setAccountOpen(false);
  }

  async function handleSaveAccount() {
    setSaving(true);
    setError('');
    const { user: updated, error: err } = await authService.updateProfile(firstName.trim(), lastName.trim());
    setSaving(false);
    if (updated) {
      onUserUpdate(updated);
      setAccountOpen(false);
    } else {
      setError(err ?? 'Update failed');
    }
  }

  function handleOpenInvite() {
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess(false);
    setInviteOpen(true);
    handleCloseMenu();
  }

  function handleCloseInvite() {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess(false);
  }

  async function handleInviteConfirm() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    const { oid, error } = await authService.invite(inviteEmail.trim(), true);
    setInviteLoading(false);
    if (!oid || error) {
      setInviteError(error ?? 'Invite failed');
      return;
    }
    const newUser: UserSummary = { oid: oid as authid, username: inviteEmail.trim() };
    onUserAdded(newUser);
    setInviteSuccess(true);
    setInviteEmail('');
  }

  return (
    <Box
      component="header"
      sx={{
        background: '#fff',
        border: '1px solid rgba(242, 171, 164, 0.55)',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(232,135,122,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          px: '1.5rem',
          py: '1.25rem',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          background: '#fcfcfc',
        }}
      >
        <Box>
          <img src={logoUrl} alt="MahjUp" style={{ width: 170 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isSaving && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                px: '0.75rem',
                py: '0.25rem',
                background: 'rgba(232,135,122,0.2)',
                border: '1px solid rgba(232,135,122,0.4)',
                borderRadius: '9999px',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'rgba(0,0,0,0.7)',
              }}
            >
              <Box sx={{ position: 'relative', display: 'flex', height: '0.5rem', width: '0.5rem' }}>
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    display: 'inline-flex',
                    height: '100%',
                    width: '100%',
                    borderRadius: '9999px',
                    background: '#e8877a',
                    opacity: 0.75,
                    animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    borderRadius: '9999px',
                    height: '0.5rem',
                    width: '0.5rem',
                    background: '#e8877a',
                  }}
                />
              </Box>
            </Box>
          )}

          <IconButton onClick={handleOpenMenu} size="small" sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'rgba(232,135,122,0.85)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#fff',
                border: '2px solid rgba(232,135,122,0.25)',
              }}
            >
              {getInitials(user)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{getDisplayName(user)}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{user.username}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleOpenAccount}>My Account</MenuItem>
            <MenuItem onClick={handleOpenInvite}>Invite a Friend</MenuItem>
            <MenuItem onClick={() => { handleCloseMenu(); onLogout(); }} sx={{ color: 'error.main' }}>
              Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Nav tabs */}
      <Box sx={{ background: '#fffcfc', borderTop: '1px solid rgba(242, 171, 164, 0.55)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v as AppTab)}
          sx={{
            px: 2,
            '& .MuiTabs-indicator': { background: '#e8877a', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: 'rgba(0,0,0,0.4)',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: 52,
              fontFamily: '"Inter", sans-serif',
            },
            '& .MuiTab-root:hover': { color: 'rgba(0,0,0,0.75)' },
            '& .Mui-selected': { color: '#e8877a !important', fontWeight: 600 },
          }}
        >
          <Tab label="My Tracker" value="tracker" />
          <Tab label="AI Insights" value="aiSummary" />
          <Tab label="Statistics" value="summary" />
          <Tab label="Card Reference" value="hands" />
        </Tabs>
      </Box>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={handleCloseInvite} maxWidth="xs" fullWidth>
        <DialogTitle>Invite a Friend</DialogTitle>
        <DialogContent>
          {inviteSuccess && <Alert severity="success" sx={{ mb: 1 }}>Invite sent!</Alert>}
          <TextField
            autoFocus
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInviteConfirm(); }}
            error={!!inviteError}
            helperText={inviteError || ' '}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvite}>Close</Button>
          <Button
            variant="contained"
            onClick={handleInviteConfirm}
            disabled={inviteLoading || !inviteEmail.trim()}
            startIcon={inviteLoading ? <CircularProgress size={16} /> : undefined}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* My Account dialog */}
      <Dialog open={accountOpen} onClose={hasName ? handleCloseAccount : undefined} maxWidth="xs" fullWidth>
        <DialogTitle>{hasName ? 'My Account' : 'Welcome to MahjUp! Enter your name'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              fullWidth
            />
            {!hasName && (
              <Alert severity="info">Please enter your name so others can identify you in games.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {hasName && <Button onClick={handleCloseAccount} disabled={saving}>Cancel</Button>}
          <Button variant="contained" onClick={handleSaveAccount} disabled={saving || (!firstName.trim() && !lastName.trim())}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
