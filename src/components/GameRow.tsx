import { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import { handData } from '../data/hands';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import type { UserSummary } from '../../model/user.model';
import { TrashIcon, PlusIcon, TrophyIcon, ChevronDownIcon } from './icons/Icons';
import PlayerHandRow from './PlayerHandRow';
import { resolveDisplayName } from '../utils/user';

interface GameRowProps {
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

export default function GameRow({ record, isExpanded, onToggle, sessionPlayers, users, usersMap, canDeleteGame, onUpdate, onDelete, onInvitePlayer }: GameRowProps) {

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
    <Paper elevation={0} variant="outlined" sx={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#ffffff' }}>
      {/* Summary header */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { background: 'rgba(0,0,0,0.02)' },
        }}
      >
        <Box sx={{ flex: 1, overflowX: 'auto', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {winner ? (
            <>
              <TrophyIcon filled style={{ width: '0.875rem', height: '0.875rem', color: '#c9920a', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{winnerName}</Typography>
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
            <Chip
              label={`${record.players.length} player${record.players.length !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <ChevronDownIcon
          style={{
            width: '1rem',
            height: '1rem',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: isExpanded ? 'none' : 'rotate(-90deg)',
          }}
        />
      </Box>

      {isExpanded && (
        <>
          <Divider />
          <Box sx={{ px: 1, pt: 0.5, pb: 1 }}>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Hand</th>
                    <th className="center col-jokers">Jokers</th>
                    <th className="center">Winner</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {record.players.map((playerHand, idx) => (
                    <PlayerHandRow
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
                </tbody>
              </table>
            </div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, pt: 0.5 }}>
              <Button
                size="small"
                startIcon={<PlusIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                onClick={handleAddPlayer}
                sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 600, px: 1 }}
              >
                Add Player
              </Button>
              {canDeleteGame && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmDelete(true)}
                  startIcon={<TrashIcon style={{ width: '0.875rem', height: '0.875rem' }} />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Delete Game
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this game?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { setConfirmDelete(false); onDelete(); }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
