import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import { handData } from '../data/hands';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import HandSelect from './HandSelect';
import type { UserSummary } from '../../model/user.model';
import { TrashIcon, PlusIcon, TrophyIcon, NotesIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface GameCardMobileProps {
  record: GameRecord;
  isExpanded: boolean;
  onToggle: () => void;
  sessionPlayers: string[];
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  canDeleteGame: boolean;
  onUpdate: (patch: Partial<GameRecord>, skipSave?: boolean) => void;
  onDelete: () => void;
  onInvitePlayer: (cb: (userId: string) => void) => void;
}

interface PlayerRowProps {
  playerHand: PlayerHand;
  isOnlyRow: boolean;
  sessionPlayers: string[];
  usedUserIds: string[];
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
  onUpdate: (patch: Partial<PlayerHand>, skipSave?: boolean) => void;
  onDelete: () => void;
  onWinnerSelect: () => void;
  onInvitePlayer: (cb: (userId: string) => void) => void;
}

function MobilePlayerRow({
  playerHand, isOnlyRow, sessionPlayers, usedUserIds, users, usersMap,
  onUpdate, onDelete, onWinnerSelect, onInvitePlayer,
}: PlayerRowProps) {
  const [notesOpen, setNotesOpen] = useState(!!playerHand.notes);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const excludeIds = new Set(usedUserIds.filter(id => id !== playerHand.userId));
  const sessionSet = new Set(sessionPlayers);
  const sessionSorted = sessionPlayers
    .filter(id => !excludeIds.has(id))
    .sort((a, b) => resolveDisplayName(a, usersMap).localeCompare(resolveDisplayName(b, usersMap)));
  const otherUsersSorted = users
    .filter(u => !sessionSet.has(u.oid) && !excludeIds.has(u.oid))
    .sort((a, b) => resolveDisplayName(a.oid, usersMap).localeCompare(resolveDisplayName(b.oid, usersMap)));

  function handlePlayerSelect(val: string) {
    if (val === '__invite__') {
      onInvitePlayer(userId => onUpdate({ userId }));
    } else {
      onUpdate({ userId: val });
    }
  }

  function handleHandSelect(cat: string, hand: string, score: number) {
    onUpdate({ category: cat, hand, score, ...(cat === 'SINGLES AND PAIRS' ? { jokers: 0 } : {}) });
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: playerHand.isWinner ? 'rgba(212,160,23,0.4)' : 'rgba(0,0,0,0.1)',
        borderRadius: '0.625rem',
        background: playerHand.isWinner ? 'rgba(212,160,23,0.06)' : 'transparent',
        p: 1.5,
      }}
    >
      <Stack spacing={1}>
        <Select
          value={playerHand.userId}
          size="small"
          fullWidth
          displayEmpty
          renderValue={val => val ? resolveDisplayName(val as string, usersMap) : <em>Select player…</em>}
          onChange={e => handlePlayerSelect(e.target.value)}
        >
          <MenuItem value="__invite__" sx={{ color: 'primary.main', fontWeight: 500 }}>+ Invite new player…</MenuItem>
          {sessionSorted.length > 0 && <ListSubheader sx={{ fontWeight: 700, fontSize: '0.8rem' }}>In Session</ListSubheader>}
          {sessionSorted.map(p => <MenuItem key={p} value={p}>{resolveDisplayName(p, usersMap)}</MenuItem>)}
          {otherUsersSorted.length > 0 && <ListSubheader sx={{ fontWeight: 700, fontSize: '0.8rem' }}>All Players</ListSubheader>}
          {otherUsersSorted.map(u => <MenuItem key={u.oid} value={u.oid}>{resolveDisplayName(u.oid, usersMap)}</MenuItem>)}
        </Select>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HandSelect
            category={playerHand.category}
            hand={playerHand.hand}
            onChange={handleHandSelect}
            fullWidth
          />
          <Select value={playerHand.category === 'SINGLES AND PAIRS' ? 0 : (playerHand.jokers ?? 0)} size="small" displayEmpty
            disabled={playerHand.category === 'SINGLES AND PAIRS'}
            onChange={e => onUpdate({ jokers: Number(e.target.value) })}
            sx={{ flexShrink: 0, width: '7rem' }}>
            {[0,1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n} Joker{n !== 1 ? 's' : ''}</MenuItem>)}
          </Select>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <Tooltip title={playerHand.isWinner ? 'Winner' : 'Mark as winner'}>
              <IconButton
                size="small"
                onClick={onWinnerSelect}
                sx={{ color: playerHand.isWinner ? '#c9920a' : 'text.disabled' }}
              >
                <TrophyIcon filled={playerHand.isWinner} style={{ width: '1.25rem', height: '1.25rem' }} />
              </IconButton>
            </Tooltip>
            {playerHand.isWinner && playerHand.score > 0 && (
              <Chip label={`${playerHand.score} pts`} size="small" color="success" sx={{ fontWeight: 700 }} />
            )}
          </Box>

          <Tooltip title={notesOpen ? 'Hide notes' : 'Add notes'}>
            <IconButton size="small" onClick={() => setNotesOpen(o => !o)}
              color={notesOpen || playerHand.notes ? 'primary' : 'default'} aria-label="Notes">
              <NotesIcon style={{ width: '1rem', height: '1rem' }} />
            </IconButton>
          </Tooltip>

          {!isOnlyRow && (
            <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)} aria-label="Remove player">
              <TrashIcon style={{ width: '0.875rem', height: '0.875rem' }} />
            </IconButton>
          )}
        </Box>

        {notesOpen && (
          <TextField
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder="Notes for this player…"
            value={playerHand.notes ?? ''}
            onChange={e => onUpdate({ notes: e.target.value }, true)}
            onBlur={() => onUpdate({})}
          />
        )}
      </Stack>
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Remove this player?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { setConfirmDelete(false); onDelete(); }}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function GameCardMobile({ record, isExpanded, onToggle, sessionPlayers, users, usersMap, canDeleteGame, onUpdate, onDelete, onInvitePlayer }: GameCardMobileProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const winner = record.players.find(p => p.isWinner);
  const winnerName = winner?.userId ? resolveDisplayName(winner.userId, usersMap) : null;

  function handlePlayerUpdate(idx: number, patch: Partial<PlayerHand>, skipSave?: boolean) {
    const updated = record.players.map((p, i) => {
      if (i !== idx) return p;
      const merged = { ...p, ...patch };
      if (merged.isWinner && 'jokers' in patch) {
        const match = merged.category && merged.hand ? handData[merged.category]?.find(item => item.h === merged.hand) : null;
        const baseScore = match?.v ?? 0;
        merged.score = merged.jokers === 0 ? baseScore * 2 : baseScore;
      }
      return merged;
    });
    onUpdate({ players: updated }, skipSave);
  }

  function handleWinnerSelect(idx: number) {
    const updated = record.players.map((p, i) => {
      if (i !== idx) return { ...p, isWinner: false };
      const match = p.category && p.hand ? handData[p.category]?.find(item => item.h === p.hand) : null;
      const baseScore = match?.v ?? p.score;
      return { ...p, isWinner: true, score: p.jokers === 0 ? baseScore * 2 : baseScore };
    });
    onUpdate({ players: updated });
  }

  function handleDeletePlayer(idx: number) {
    onUpdate({ players: record.players.filter((_, i) => i !== idx) });
  }

  function handleAddPlayer() {
    const newPlayer: PlayerHand = { userId: '', category: '', hand: '', jokers: 0, isWinner: false, score: 0 };
    onUpdate({ players: [...record.players, newPlayer] });
  }

  const usedUserIds = record.players.map(p => p.userId).filter(Boolean);

  return (
    <>
    <Paper elevation={0} variant="outlined" sx={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#fffafa' }}>
      {/* Summary row — tap to expand */}
      <Box
        onClick={onToggle}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, cursor: 'pointer', userSelect: 'none' }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{
            width: '1.25rem',
            height: '1.25rem',
            flexShrink: 0,
            color: 'text.secondary',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            fill: 'currentColor',
          }}
        >
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </Box>
        <Box sx={{ flex: 1, overflowX: 'auto', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {winner ? (
            <>
              <TrophyIcon filled style={{ width: '0.875rem', height: '0.875rem', color: '#c9920a', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                {winnerName}
              </Typography>
              {winner.hand && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  · {winner.hand}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.disabled">
              <em>{record.players.length > 0 ? 'No winner set' : 'No players'}</em>
            </Typography>
          )}
          {record.players.length > 0 && (
            <Chip label={`${record.players.length} player${record.players.length !== 1 ? 's' : ''}`} size="small" variant="outlined" />
          )}
        </Box>
      </Box>

      {/* Accordion body */}
      <Collapse in={isExpanded}>
        <Divider />
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          {record.players.map((playerHand, idx) => (
            <MobilePlayerRow
              key={idx}
              playerHand={playerHand}
              isOnlyRow={record.players.length === 1}
              sessionPlayers={sessionPlayers}
              usedUserIds={usedUserIds}
              users={users}
              usersMap={usersMap}
              onUpdate={(patch, skipSave) => handlePlayerUpdate(idx, patch, skipSave)}
              onDelete={() => handleDeletePlayer(idx)}
              onWinnerSelect={() => handleWinnerSelect(idx)}
              onInvitePlayer={onInvitePlayer}
            />
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
              onClick={handleAddPlayer}
              sx={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              Add Player
            </Button>
            {canDeleteGame && (
              <Button variant="outlined" color="error" size="small" onClick={() => setConfirmDelete(true)}
                startIcon={<TrashIcon style={{ width: '1rem', height: '1rem' }} />}>
                Delete
              </Button>
            )}
          </Box>
        </Stack>
      </Collapse>
    </Paper>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this game?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { setConfirmDelete(false); onDelete(); }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
