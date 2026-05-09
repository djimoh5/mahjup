import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import type { authid } from '../../model/id.model';
import { authService } from '../services/auth.service';
import GameRow from './GameRow';
import GameCardMobile from './GameCardMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface SessionGroupProps {
  session: MahjSession;
  games: GameRecord[];
  initialEditing?: boolean;
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  currentUserOid: string;
  onAddGame: () => void;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateSession: (patch: Partial<MahjSession>) => void;
  onDeleteSession: () => void;
  onUserAdded: (newUser: UserSummary) => void;
}

const INVITE_SENTINEL: UserSummary = { oid: '__invite__' as authid, username: '__invite__' };

function userDisplayLabel(u: UserSummary): string {
  if (u.firstName || u.lastName)
    return [u.firstName, u.lastName].filter(Boolean).join(' ');
  return u.username;
}

function formatDateTime(dt: string): string {
  if (!dt) return '—';
  const [datePart] = dt.split('T');
  const [y, m, d] = datePart.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const dayName = days[date.getDay()];
  const monthName = months[parseInt(m) - 1];
  return `${dayName}, ${monthName} ${parseInt(d)}`;
}

export default function SessionGroup({
  session, games, initialEditing, users, usersMap, currentUserOid,
  onAddGame, onUpdate, onDelete, onUpdateSession, onDeleteSession, onUserAdded,
}: SessionGroupProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(initialEditing ?? false);

  const [editTitle, setEditTitle] = useState(session.title ?? '');
  const [editDateTime, setEditDateTime] = useState(session.dateTime);
  const [editPlayers, setEditPlayers] = useState<string[]>([...session.players]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  function handleOpenEdit() {
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers([...session.players]);
    setIsEditing(true);
  }

  function handleSave() {
    onUpdateSession({
      title: editTitle.trim() || undefined,
      dateTime: editDateTime,
      players: editPlayers as authid[],
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers([...session.players]);
    setIsEditing(false);
  }

  async function handleInviteConfirm() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    const { oid, error } = await authService.invite(inviteEmail.trim());
    setInviteLoading(false);
    if (!oid || error) {
      setInviteError(error ?? 'Invite failed');
      return;
    }
    const newUser: UserSummary = { oid: oid as authid, username: inviteEmail.trim() };
    setEditPlayers(prev => [...prev, oid]);
    onUserAdded(newUser);
    setInviteEmail('');
    setInviteOpen(false);
  }

  const selectedUsers: UserSummary[] = editPlayers.map(
    oid => usersMap[oid] ?? { oid: oid as authid, username: oid }
  );

  return (
    <Paper sx={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(242,171,164,0.55)' }}>
      {/* Session header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          px: '1rem',
          py: '0.875rem',
          borderBottom: '1px solid rgba(242,171,164,0.55)',
          flexWrap: 'wrap',
        }}
      >
        <IconButton
          size="small"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          sx={{ color: 'text.secondary', flexShrink: 0 }}
        >
          <ChevronDownIcon
            style={{
              width: '1.125rem',
              height: '1.125rem',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'none' : 'rotate(-90deg)',
            }}
          />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
            {formatDateTime(session.dateTime)}
          </Typography>
          {session.title && (
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic' }}>
              {session.title}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {session.players.map(p => (
              <Chip key={p} label={resolveDisplayName(p, usersMap)} size="small" />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {!isEditing && (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={onAddGame}
                startIcon={<PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                sx={{ borderRadius: '0.5rem', fontSize: '0.8125rem', py: '0.375rem', px: '0.75rem' }}
              >
                Add Game
              </Button>
              <IconButton
                size="small"
                onClick={handleOpenEdit}
                aria-label="Edit session"
                sx={{
                  border: '1px solid rgba(242,171,164,0.55)',
                  borderRadius: '0.5rem',
                  color: 'text.secondary',
                  '&:hover': { background: 'rgba(46,94,66,0.08)', color: 'text.primary' },
                }}
              >
                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onDeleteSession}
                aria-label="Delete session"
                sx={{
                  border: '1px solid rgba(242,171,164,0.55)',
                  borderRadius: '0.5rem',
                  color: 'text.secondary',
                  '&:hover': { background: 'rgba(232,135,122,0.1)', color: 'primary.main', borderColor: 'primary.main' },
                }}
              >
                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* Edit form */}
      {isEditing && (
        <Box
          sx={{
            px: '1.25rem',
            pt: '1rem',
            pb: '1.25rem',
            borderBottom: '1px solid rgba(242,171,164,0.55)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Title (optional)
              </Typography>
              <TextField
                type="text"
                value={editTitle}
                placeholder="e.g. Tuesday Morning Mahj"
                onChange={e => setEditTitle(e.target.value)}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Date
              </Typography>
              <TextField
                type="date"
                value={editDateTime.split('T')[0]}
                onChange={e => setEditDateTime(e.target.value)}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Players
              </Typography>
              <Autocomplete
                multiple
                options={users}
                value={selectedUsers}
                getOptionLabel={u => u.oid === '__invite__' ? '+ Invite new player…' : userDisplayLabel(u)}
                isOptionEqualToValue={(option, value) => option.oid === value.oid}
                filterOptions={(options, state) => {
                  const filtered = options.filter(u => {
                    const name = [u.firstName, u.lastName, u.username].filter(Boolean).join(' ').toLowerCase();
                    return name.includes(state.inputValue.toLowerCase());
                  });
                  return [...filtered, INVITE_SENTINEL];
                }}
                onChange={(_, selected) => {
                  if (selected.some(u => u.oid === '__invite__')) {
                    setInviteOpen(true);
                  } else {
                    setEditPlayers(selected.map(u => u.oid as string));
                  }
                }}
                renderOption={(props, option) => {
                  if (option.oid === '__invite__') {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { key: _k, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: unknown };
                    return (
                      <li key="__invite__" {...rest} style={{ color: '#2e5e42', fontWeight: 500 }}>
                        + Invite new player…
                      </li>
                    );
                  }
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { key: _k, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: unknown };
                  return (
                    <li key={option.oid} {...rest}>
                      {userDisplayLabel(option)}
                      {option.oid === currentUserOid && (
                        <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                          (me)
                        </Typography>
                      )}
                    </li>
                  );
                }}
                renderInput={params => <TextField {...params} placeholder="Search players…" />}
              />
            </Box>

            <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save Session
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{
                  borderColor: 'rgba(242,171,164,0.55)',
                  color: 'text.secondary',
                  borderRadius: '0.625rem',
                  '&:hover': { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(242,171,164,0.55)' },
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Games area */}
      {isExpanded && !isEditing && (
        <Box sx={{ p: '0.75rem' }}>
          {games.length === 0 ? (
            <Box sx={{ p: '1.5rem', textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
              No games yet — click "Add Game" to record the first one.
            </Box>
          ) : isMobile ? (
            <Stack spacing={1}>
              {games.map(game => (
                <GameCardMobile
                  key={game.oid}
                  record={game}
                  sessionPlayers={session.players}
                  usersMap={usersMap}
                  onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                  onDelete={() => onDelete(game.oid)}
                />
              ))}
            </Stack>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="col-cat">Winning Category</th>
                    <th>Winning Hand</th>
                    <th className="center col-result">Winner</th>
                    <th className="center col-pts">Points</th>
                    <th className="col-opp">Players</th>
                    <th className="col-del"></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <GameRow
                      key={game.oid}
                      record={game}
                      sessionPlayers={session.players}
                      usersMap={usersMap}
                      onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                      onDelete={() => onDelete(game.oid)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Box>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail(''); setInviteError(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>Invite new player</DialogTitle>
        <DialogContent>
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
          <Button onClick={() => { setInviteOpen(false); setInviteEmail(''); setInviteError(''); }}>
            Cancel
          </Button>
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
    </Paper>
  );
}
