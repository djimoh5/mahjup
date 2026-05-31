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
import { handData } from '../data/hands';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { PencilIcon, TrashIcon, CheckIcon, PlusIcon, TrophyIcon, NotesIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface GameCardMobileProps {
  record: GameRecord;
  sessionPlayers: string[];
  users: UserSummary[];
  usersMap: Record<string, UserSummary>;
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
  const categoryHands = handData[playerHand.category] ?? [];
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

  function handleCategoryChange(cat: string) {
    onUpdate({ category: cat, hand: '', score: 0 });
  }

  function handleHandChange(hand: string) {
    const match = handData[playerHand.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match?.v ?? 0 });
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Select value={playerHand.category} size="small" fullWidth displayEmpty
            onChange={e => handleCategoryChange(e.target.value)}>
            <MenuItem value=""><em>Category…</em></MenuItem>
            {Object.keys(handData).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
          <Tooltip title={!playerHand.category ? 'Choose a category first' : ''} placement="top">
            <span>
              <Select value={playerHand.hand} size="small" fullWidth displayEmpty disabled={!playerHand.category}
                onChange={e => handleHandChange(e.target.value)}>
                <MenuItem value=""><em>Hand…</em></MenuItem>
                {categoryHands.map(item => <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>)}
              </Select>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Select value={playerHand.jokers ?? 0} size="small" displayEmpty
            onChange={e => onUpdate({ jokers: Number(e.target.value) })}
            sx={{ width: '7rem' }}>
            {[0,1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n} Joker{n !== 1 ? 's' : ''}</MenuItem>)}
          </Select>

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
            <IconButton size="small" color="error" onClick={onDelete} aria-label="Remove player">
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
    </Box>
  );
}

export default function GameCardMobile({ record, sessionPlayers, users, usersMap, onUpdate, onDelete, onInvitePlayer }: GameCardMobileProps) {
  const [isEditing, setIsEditing] = useState(false);

  const winner = record.players.find(p => p.isWinner);
  const winnerName = winner?.userId ? resolveDisplayName(winner.userId, usersMap) : null;

  function handlePlayerUpdate(idx: number, patch: Partial<PlayerHand>, skipSave?: boolean) {
    const updated = record.players.map((p, i) => i === idx ? { ...p, ...patch } : p);
    onUpdate({ players: updated }, skipSave);
  }

  function handleWinnerSelect(idx: number) {
    const updated = record.players.map((p, i) => {
      if (i !== idx) return { ...p, isWinner: false };
      const match = p.category && p.hand ? handData[p.category]?.find(item => item.h === p.hand) : null;
      return { ...p, isWinner: true, score: match?.v ?? p.score };
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
    <Paper elevation={0} variant="outlined" sx={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
      {/* Summary row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25 }}>
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
              {winner.score > 0 && (
                <Chip label={`${winner.score}pts`} size="small" color="success" sx={{ fontWeight: 700 }} />
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
        {!isEditing && (
          <IconButton size="small" onClick={() => setIsEditing(true)} aria-label="Edit" sx={{ flexShrink: 0 }}>
            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Edit body */}
      {isEditing && (
        <>
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

            <Button
              size="small"
              startIcon={<PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
              onClick={handleAddPlayer}
              sx={{ alignSelf: 'flex-start', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Add Player
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" color="error" size="small" onClick={onDelete}
                startIcon={<TrashIcon style={{ width: '1rem', height: '1rem' }} />}>
                Delete
              </Button>
              <Button variant="contained" size="small" onClick={() => setIsEditing(false)}
                startIcon={<CheckIcon style={{ width: '1rem', height: '1rem' }} />}>
                Done
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Paper>
  );
}
