import { useState } from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { handData } from '../data/hands';
import type { PlayerHand } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { TrashIcon, TrophyIcon, NotesIcon } from './icons/Icons';
import { resolveDisplayName } from '../utils/user';

interface PlayerHandRowProps {
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

export default function PlayerHandRow({
  playerHand, isOnlyRow, sessionPlayers, usedUserIds, users, usersMap,
  onUpdate, onDelete, onWinnerSelect, onInvitePlayer,
}: PlayerHandRowProps) {
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

  function handleCategoryChange(cat: string) {
    onUpdate({ category: cat, hand: '', score: 0 });
  }

  function handleHandChange(hand: string) {
    const match = handData[playerHand.category]?.find(item => item.h === hand);
    onUpdate({ hand, score: match?.v ?? 0 });
  }

  function handlePlayerSelect(val: string) {
    if (val === '__invite__') {
      onInvitePlayer(userId => onUpdate({ userId }));
    } else {
      onUpdate({ userId: val });
    }
  }

  return (
    <>
      <tr style={{ background: playerHand.isWinner ? 'rgba(212,160,23,0.07)' : undefined }}>
        <td>
          <Select
            value={playerHand.userId}
            size="small"
            fullWidth
            displayEmpty
            renderValue={val => val ? resolveDisplayName(val as string, usersMap) : <em>Player…</em>}
            onChange={e => handlePlayerSelect(e.target.value)}
          >
            <MenuItem value="__invite__" sx={{ color: 'primary.main', fontWeight: 500 }}>+ Invite new player…</MenuItem>
            {sessionSorted.map(p => <MenuItem key={p} value={p}>{resolveDisplayName(p, usersMap)}</MenuItem>)}
            {otherUsersSorted.map(u => <MenuItem key={u.oid} value={u.oid}>{resolveDisplayName(u.oid, usersMap)}</MenuItem>)}
          </Select>
        </td>
        <td>
          <Select value={playerHand.category} size="small" fullWidth displayEmpty
            onChange={e => handleCategoryChange(e.target.value)}>
            <MenuItem value=""><em>Category…</em></MenuItem>
            {Object.keys(handData).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </Select>
        </td>
        <td>
          <Tooltip title={!playerHand.category ? 'Choose a category first' : ''} placement="top">
            <span>
              <Select value={playerHand.hand} size="small" fullWidth displayEmpty disabled={!playerHand.category}
                onChange={e => handleHandChange(e.target.value)}>
                <MenuItem value=""><em>Hand…</em></MenuItem>
                {categoryHands.map(item => <MenuItem key={item.h} value={item.h}>{item.h}</MenuItem>)}
              </Select>
            </span>
          </Tooltip>
        </td>
        <td className="center">
          <Select value={playerHand.jokers ?? 0} size="small"
            onChange={e => onUpdate({ jokers: Number(e.target.value) })}
            sx={{ width: '4rem' }}>
            {[0,1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </td>
        <td className="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
            <Tooltip title={playerHand.isWinner ? 'Winner' : 'Mark as winner'}>
              <IconButton
                size="small"
                onClick={onWinnerSelect}
                sx={{ color: playerHand.isWinner ? '#c9920a' : 'text.disabled', p: '2px' }}
              >
                <TrophyIcon filled={playerHand.isWinner} style={{ width: '1.125rem', height: '1.125rem' }} />
              </IconButton>
            </Tooltip>
            {playerHand.isWinner && playerHand.score > 0 && (
              <Chip label={`${playerHand.score}pts`} size="small" color="success" sx={{ fontWeight: 700 }} />
            )}
          </Box>
        </td>
        <td className="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
            <Tooltip title={notesOpen ? 'Hide notes' : 'Add notes'}>
              <IconButton size="small" onClick={() => setNotesOpen(o => !o)}
                color={notesOpen || playerHand.notes ? 'primary' : 'default'} aria-label="Notes">
                <NotesIcon style={{ width: '1rem', height: '1rem' }} />
              </IconButton>
            </Tooltip>
            {!isOnlyRow && (
              <IconButton size="small" onClick={onDelete} color="error" aria-label="Remove player">
                <TrashIcon style={{ width: '0.875rem', height: '0.875rem' }} />
              </IconButton>
            )}
          </Box>
        </td>
      </tr>
      {notesOpen && (
        <tr className="notes-row" style={{ background: playerHand.isWinner ? 'rgba(212,160,23,0.07)' : undefined }}>
          <td colSpan={6}>
            <TextField multiline rows={2} fullWidth size="small" placeholder="Notes for this player…"
              value={playerHand.notes ?? ''}
              onChange={e => onUpdate({ notes: e.target.value }, true)}
              onBlur={() => onUpdate({})} />
          </td>
        </tr>
      )}
    </>
  );
}
