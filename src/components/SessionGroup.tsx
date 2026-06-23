import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import type { authid } from '../../model/id.model';
import { authService } from '../services/auth.service';
import GameRow from './GameRow';
import GameCardMobile from './GameCardMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon/*, RefreshIcon */} from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface SessionGroupProps {
  session: MahjSession;
  games: GameRecord[];
  isPending: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  initialEditing?: boolean;
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  currentUserOid: string;
  onAddGame: () => Promise<{ error?: string }>;
  onUpdate: (id: string, patch: Partial<GameRecord>, skipSave?: boolean) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
  onUpdateSession: (patch: Partial<MahjSession>) => Promise<{ error?: string }>;
  onSaveNewSession: (patch: Partial<MahjSession>) => Promise<{ error?: string }>;
  onCancelNewSession: () => void;
  onDeleteSession: () => Promise<{ error?: string }>;
  onUserAdded: (newUser: UserSummary) => void;
  onSavePlayerHand: (gameOid: string, player: PlayerHand) => Promise<{ error?: string }>;
  onRefresh: () => void;
  isRefreshing: boolean;
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
  session, games, isPending, isExpanded, onToggle, onExpand, initialEditing, users, usersMap, currentUserOid,
  onAddGame, onUpdate, onDelete, onUpdateSession, onSaveNewSession, onCancelNewSession, onDeleteSession, onUserAdded,
  onSavePlayerHand, /*onRefresh, isRefreshing,*/
}: SessionGroupProps) {
  const isSessionCreator = session.userId === currentUserOid;
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(initialEditing ?? false);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(false);
  const [deleteSessionError, setDeleteSessionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [addGameError, setAddGameError] = useState<string | null>(null);

  const [expandedGameId, setExpandedGameId] = useState<string | null>(
    () => games.find(g => g.players.length === 0)?.oid ?? null
  );

  const prevGamesRef = useRef(games);
  useEffect(() => {
    if (games.length > prevGamesRef.current.length) {
      const prevIds = new Set(prevGamesRef.current.map(g => g.oid));
      const newGame = games.find(g => !prevIds.has(g.oid));
      if (newGame) setExpandedGameId(newGame.oid);
    }
    prevGamesRef.current = games;
  }, [games]);

  useEffect(() => {
    if (isExpanded && games.length === 1) {
      setExpandedGameId(games[0].oid);
    }
  }, [isExpanded]);

  const [editTitle, setEditTitle] = useState(session.title ?? '');
  const [editDateTime, setEditDateTime] = useState(session.dateTime);
  const [editPlayers, setEditPlayers] = useState<string[]>([...session.players]);


  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [pendingInviteCallback, setPendingInviteCallback] = useState<((userId: string) => void) | null>(null);

  function handleOpenEdit() {
    onExpand();
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers([...session.players]);
    setIsEditing(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    const patch = {
      title: editTitle.trim() || undefined,
      dateTime: editDateTime,
      players: editPlayers as authid[],
    };
    const { error } = isPending
      ? await onSaveNewSession(patch)
      : await onUpdateSession(patch);
    setIsSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    setIsEditing(false);
    if (isPending && games.length > 0) setExpandedGameId(games[0].oid);
  }

  function handleCancel() {
    if (isPending) {
      onCancelNewSession();
      return;
    }
    setEditTitle(session.title ?? '');
    setEditDateTime(session.dateTime);
    setEditPlayers([...session.players]);
    setIsEditing(false);
    setSaveError(null);
  }

  async function handleAddGame() {
    setIsAddingGame(true);
    setAddGameError(null);
    const { error } = await onAddGame();
    setIsAddingGame(false);
    if (error) setAddGameError(error);
  }

  function handleInviteOpen(cb: (userId: string) => void) {
    setPendingInviteCallback(() => cb);
    setInviteOpen(true);
  }

  function handleInviteClose() {
    setInviteOpen(false);
    setInviteEmail('');
    setInviteError('');
    setPendingInviteCallback(null);
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
    onUserAdded(newUser);
    if (pendingInviteCallback) {
      pendingInviteCallback(oid);
      setPendingInviteCallback(null);
    } else {
      setEditPlayers(prev => [...prev, oid]);
    }
    setInviteEmail('');
    setInviteOpen(false);
  }

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
        <ButtonBase
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0, textAlign: 'left', borderRadius: '0.5rem', py: 0.25 }}
        >
          <ChevronDownIcon
            style={{
              width: '1.125rem',
              height: '1.125rem',
              flexShrink: 0,
              transition: 'transform 0.2s',
              transform: isExpanded ? 'none' : 'rotate(-90deg)',
              color: 'rgba(0,0,0,0.54)',
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            {session.title && (
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                {session.title}
              </Typography>
            )}
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
              {formatDateTime(session.dateTime)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {session.players.map(p => (
                <Chip key={p} label={resolveDisplayName(p, usersMap)} size="small" />
              ))}
            </Box>
          </Box>
        </ButtonBase>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/*{!isEditing && (
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh session"
              sx={{
                border: '1px solid rgba(242,171,164,0.55)',
                borderRadius: '0.5rem',
                color: 'text.secondary',
                '&:hover': { background: 'rgba(46,94,66,0.08)', color: 'text.primary' },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                }}
              >
                <RefreshIcon style={{ width: '1rem', height: '1rem' }} />
              </Box>
            </IconButton>
          )}*/}
          {!isEditing && isSessionCreator && (
            <>
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
                onClick={() => setConfirmDeleteSession(true)}
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
            background: 'rgba(255, 255, 255, 0.5)',
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

            {saveError && (
              <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mb: 0.5 }}>
                {saveError}
              </Alert>
            )}
            <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {isSaving ? 'Saving…' : 'Save Session'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSaving}
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
              No games yet — add one below.
            </Box>
          ) : isMobile ? (
            <Stack spacing={1}>
              {games.map(game => (
                <GameCardMobile
                  key={game.oid}
                  record={game}
                  isExpanded={expandedGameId === game.oid}
                  onToggle={() => setExpandedGameId(id => id === game.oid ? null : game.oid)}
                  sessionPlayers={session.players}
                  users={users}
                  usersMap={usersMap}
                  canDeleteGame={game.userId === currentUserOid || isSessionCreator}
                  onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                  onDelete={() => onDelete(game.oid)}
                  onInvitePlayer={handleInviteOpen}
                  onSavePlayerHand={(player) => onSavePlayerHand(game.oid, player)}
                />
              ))}
            </Stack>
          ) : (
            <Stack spacing={1}>
              {games.map(game => (
                <GameRow
                  key={game.oid}
                  record={game}
                  isExpanded={expandedGameId === game.oid}
                  onToggle={() => setExpandedGameId(id => id === game.oid ? null : game.oid)}
                  sessionPlayers={session.players}
                  users={users}
                  usersMap={usersMap}
                  canDeleteGame={game.userId === currentUserOid || isSessionCreator}
                  onUpdate={(patch, skipSave) => onUpdate(game.oid, patch, skipSave)}
                  onDelete={() => onDelete(game.oid)}
                  onInvitePlayer={handleInviteOpen}
                  onSavePlayerHand={(player) => onSavePlayerHand(game.oid, player)}
                />
              ))}
            </Stack>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            {addGameError && (
              <Alert severity="error" onClose={() => setAddGameError(null)} sx={{ fontSize: '0.8125rem', py: 0 }}>
                {addGameError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                onClick={handleAddGame}
                disabled={isAddingGame}
                startIcon={
                  isAddingGame
                    ? <CircularProgress size={14} color="inherit" />
                    : <PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                }
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {isAddingGame ? 'Adding…' : 'Add Game'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={handleInviteClose} maxWidth="xs" fullWidth>
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
          <Button onClick={handleInviteClose}>Cancel</Button>
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

      <Dialog open={confirmDeleteSession} onClose={() => setConfirmDeleteSession(false)}>
        <DialogTitle>Delete this session?</DialogTitle>
        {deleteSessionError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" onClose={() => setDeleteSessionError(null)}>{deleteSessionError}</Alert>
          </Box>
        )}
        <DialogActions>
          <Button onClick={() => setConfirmDeleteSession(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            const { error } = await onDeleteSession();
            if (error) { setDeleteSessionError(error); return; }
            setConfirmDeleteSession(false);
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
